#!/usr/bin/env node

const fs = require('fs').promises;
const core = require('@actions/core');
const {glob} = require('glob');
const path = require('path');

// Allowed image dimensions
const PNG_RES = [[16, 16], [32, 32], [64, 64], [128, 128]];

let seenImages = [];
let errors = false;

function parseArgs(argv) {
  const sep = argv.indexOf('--');
  if (sep === -1) return {touchedEntries: null, touchedIcons: null};
  return {
    touchedEntries: argv.slice(0, sep).filter(Boolean),
    touchedIcons: argv.slice(sep + 1).filter(Boolean),
  };
}

function imgPathFor(file, img) {
  const domain = path.parse(file).name;
  return `icons/${img ? `${img[0]}/${img}`:`${domain[0]}/${domain}.svg`}`;
}

async function main() {
  const {touchedEntries, touchedIcons} = parseArgs(process.argv.slice(2));

  const [allEntries, allImages] = await Promise.all([
    glob('entries/**/*.json'), glob('icons/*/*.*')]);

  await buildSeenImages(allEntries);
  await reportMissingImages(touchedEntries ?? allEntries);
  await parseImages(touchedIcons ?? allImages);

  process.exit(+errors);
}

async function alternativeSource(image) {
  const res = await fetch(`https://api.2fa.directory/${image}`, {
    headers: {
      'user-agent': '2factorauth/passkeys +https://2fa.directory/bots',
    },
  });
  return res.ok;
}

// Populates seenImages from every entry in the repo, without reporting errors -
// needed so a touched icon referenced only by an untouched entry isn't flagged "unused".
async function buildSeenImages(entries) {
  await Promise.all(entries.map(async (file) => {
    try {
      const json = JSON.parse(await fs.readFile(file, 'utf8'));
      const entry = json[Object.keys(json)[0]];
      const imgPath = imgPathFor(file, entry.img);
      await fs.readFile(imgPath);
      seenImages.push(imgPath);
    } catch (e) {
      // Missing image or malformed JSON: not this function's concern.
    }
  }));
}

async function reportMissingImages(entries) {
  await Promise.all(entries.map(async (file) => {
    let json;
    try {
      json = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (e) {
      return; // malformed JSON is reported by tests/json.js
    }
    const entry = json[Object.keys(json)[0]];
    const imgPath = imgPathFor(file, entry.img);

    try {
      await fs.readFile(imgPath);
    } catch (e) {
      if (!await alternativeSource(imgPath)) {
        core.error(`Image ${imgPath} not found.`, {file});
        errors = true;
      }
    }
  }));
}

async function parseImages(images) {
  await Promise.all(images.map(async (image) => {
    if (!seenImages.includes(image)) {
      core.error(`Unused image`, {file: image});
      errors = true;
    }

    if (image.endsWith('.png')) {
      if (!dimensionsAreValid(await getPNGDimensions(image), PNG_RES)) {
        core.error(`PNGs must be one of the following dimensions: ${PNG_RES.map((a) => a.join('x')).join(', ')}`,
          {file: image});
        errors = true;
      }
    }
  }));
}

function dimensionsAreValid(dimensions, validSizes) {
  return validSizes.some((size) => size[0] === dimensions[0] && size[1] === dimensions[1]);
}

async function getPNGDimensions(file) {
  const buffer = await fs.readFile(file);
  if (buffer.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file} is not a valid PNG file`);

  // Return [width, height]
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

main().catch((e) => core.setFailed(e));
