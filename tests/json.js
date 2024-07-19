#!/usr/bin/env node

const fs = require('fs').promises;
const core = require('@actions/core');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const schema = require('./entry_schema.json');
const {basename} = require('node:path');
const path = require('path');

const ajv = new Ajv({strict: false, allErrors: true});
addFormats(ajv);
require('ajv-errors')(ajv);

const validate = ajv.compile(schema);
let errors = false;

/**
 * Logs an error message and sets the errors flag to true.
 *
 * @param {string} message - The error message to log.
 * @param {object} properties - Additional properties to log with the error.
 */
function error(message, properties) {
  core.error(message, properties);
  errors = true;
}

async function main() {
  const files = process.argv.slice(2);

  await Promise.all(files.map(async (file) => {
    try {
      const json = await JSON.parse(await fs.readFile(file, 'utf8'));
      const entry = json[Object.keys(json)[0]];
      validateJSONSchema(file, json);
      validateFileContents(file, entry);
    } catch (e) {
      error(`Failed to process ${file}: ${err.message}`, {file});
    }
  }));

  process.exit(+errors);
}

/**
 * Validates the JSON schema of the provided file.
 *
 * @param {string} file - File path to be validated.
 * @param {object} json - Parsed JSON content of the file.
 */
function validateJSONSchema(file, json) {
  const valid = validate(json);
  if (!valid) {
    errors = true;
    validate.errors.forEach((err) => {
      const {message, instancePath, keyword: title} = err;
      const instance = instancePath?.split('/');
      if (message) error(`${instance[instance.length - 1]} ${message}`, {file, title}); else error(err, {file});
    });
  }
}

/**
 * Validates the contents of the provided file according to custom rules.
 *
 * @param {string} file - File path to be validated.
 * @param {object} entry - The main entry object within the JSON content.
 */
function validateFileContents(file, entry) {
  const domain = basename(file, '.json');

  if (entry['url'] === `https://${domain}`) error(`Unnecessary url element defined.`, {file});

  if (entry['img'] === `${entry.domain}.svg`) error(`Unnecessary img element defined.`, {file});

  if (file !== `entries/${domain[0]}/${domain}.json`) error(`Entry should be placed in entries/${domain[0]}/`, {file});

  if((entry['mfa'] || entry['passwordless']) && !entry['documentation']) core.warning('Since there is no documentation available, please could you provide us with screenshots of the setup/login process as evidence of 2FA? Please remember to block out any personal information.', {file, title: 'Missing Documentation'});
}

module.exports = main();
