#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const {Validator} = require('jsonschema');
const core = require('@actions/core');
require("dotenv").config();

const entriesGlob = 'entries/*/*.json';

const readJSONFile = async (filePath) => {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
};

const writeJSONFile = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

const ensureDir = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, {recursive: true});
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
};

const processEntries = (entries, all) => {
  for (const [key, entry] of Object.entries(entries)) {
    const {'additional-domains': additionalDomains, img, categories, ...processedEntry} = entry;

    if (additionalDomains) {
      additionalDomains.forEach((domain) => {
        all[domain] = {...processedEntry};
      });
    }

    all[key] = {...processedEntry};
  }
};

const publicApi = async (allEntries) => {
  const all = {};
  const passwordless = {};
  const mfa = {};
  const outputPath = 'public/v1';

  processEntries(allEntries, all);

  // Separate mfa and passwordless entries
  for (const [key, entry] of Object.entries(all)) {
    if (entry['mfa']) mfa[key] = entry;
    if (entry['passwordless']) passwordless[key] = entry;
  }

  // Write JSON files in parallel
  await ensureDir(outputPath);
  await Promise.all([
    writeJSONFile(`${outputPath}/all.json`, Object.fromEntries(Object.entries(all).sort())),
    writeJSONFile(`${outputPath}/mfa.json`, Object.fromEntries(Object.entries(mfa).sort())),
    writeJSONFile(`${outputPath}/passwordless.json`, Object.fromEntries(Object.entries(passwordless).sort())),
    writeJSONFile(
      `${outputPath}/supported.json`,
      Object.fromEntries(Object.entries(all).filter(([_, v]) => v['mfa'] || v['passwordless']).sort()),
    ),
  ]);
};

const privateApi = async (allEntries) => {
  const all = {};
  const regions = {};
  const outputPath = 'public/private';

  // Process entries
  for (const [key, entry] of Object.entries(allEntries)) {
    const {regions: entryRegions, 'additional-domains': additionalDomains, ...processedEntry} = entry;

    if (entryRegions) {
      entryRegions.forEach((region) => {
        if (region[0] !== '-') {
          regions[region] = regions[region] || {count: 0};
          regions[region].count += 1;
        }
      });
    }

    processedEntry.categories = Array.isArray(entry.categories) ?
      entry.categories:
      entry.categories ? [entry.categories]:[];
    all[key] = processedEntry;
  }

  regions.int = {count: Object.keys(all).length, selection: true};

  // Write JSON files in parallel
  await ensureDir(outputPath);
  await Promise.all([
    writeJSONFile(`${outputPath}/all.json`, Object.fromEntries(Object.entries(all).sort())),
    writeJSONFile(
      `${outputPath}/regions.json`,
      Object.fromEntries(Object.entries(regions).sort(([, a], [, b]) => b.count - a.count)),
    ),
  ]);
};

const validateSchema = async () => {
  const schema = await readJSONFile('tests/api_schema.json');
  const validator = new Validator();

  const files = glob.sync('public/v1/*.json');
  await Promise.all(files.map(async (file) => {
    const data = await readJSONFile(file);
    const validationResult = validator.validate(data, schema);
    if (!validationResult.valid) {
      validationResult.errors.forEach((error) => {
        core.error(error.stack, {file});
      });
      process.exit(1);
    }
  }));
};

const fetch2FAEntries = async () => {
  const privateEntries = {};
  const publicEntries = {};

  const res = await fetch('https://api.2fa.directory/v3/all.json');
  const data = await res.json();
  for (const d of data) {
    const [name, entry] = d;
    if (!entry['tfa'] || !entry['tfa'].includes('u2f')) {
      privateEntries[name] = {
        domain: entry.domain,
        contact: entry.contact,
        categories: entry.keywords.length === 1 ? entry.keywords[0]:entry.keywords,
      };
      if (entry.contact) {
        publicEntries[entry.domain] = {
          contact: entry.contact,
          categories: entry.keywords.length === 1 ? entry.keywords[0]:entry.keywords,
        };
      } else {
        delete privateEntries[name].contact;
      }
    }else if(entry['tfa'].includes('u2f')){
      privateEntries[name] = {
        domain: entry.domain,
        mfa: 'allowed',
        documentation: entry.documentation,
        recovery: entry.recovery,
        notes: entry.notes,
        categories: entry.keywords,
      };
      publicEntries[entry.domain] = {
        mfa: 'allowed',
        documentation: entry.documentation,
        recovery: entry.recovery,
        notes: entry.notes,
      };
    }
  }
  return [privateEntries, publicEntries];
};

const generateApis = async () => {
  let publicEntries = {};
  let privateEntries = {};

  // Parse all entries
  const files = glob.sync(entriesGlob);
  await Promise.all(files.map(async (file) => {
    const data = await readJSONFile(file);
    const key = path.basename(file, '.json');
    publicEntries[key] = data[Object.keys(data)[0]];
    privateEntries[Object.keys(data)[0]] = {...data[Object.keys(data)[0]], domain: key};
  }));

  // Fetch entries from the 2FA Directory
  if (!process.env.NO_2FA_ENTRIES) {
    const [priv, pub] = await fetch2FAEntries();
    publicEntries = {...pub, ...publicEntries};
    privateEntries = {...priv, ...privateEntries};
  }

  // Generate APIs
  await Promise.all([
    publicApi(publicEntries),
    privateApi(privateEntries),
  ]);

  // Validate Public API files against JSON Schema
  await validateSchema();
};

generateApis().catch((err) => {
  core.error(err);
  process.exit(1);
});
