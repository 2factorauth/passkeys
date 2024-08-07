#!/usr/bin/env node

const fs = require('fs').promises;
const core = require('@actions/core');
const {glob} = require('glob');
const path = require('path');

// Allowed image dimensions
const PNG_RES = [[16, 16], [32, 32], [64, 64], [128, 128]];

let seenImages = [];
let errors = false;

async function main() {
  const [entries, images] = await Promise.all([
    glob('entries/**/*.json'), glob('icons/*/*.*')]);

  await parseEntries(entries);
  await parseImages(images);

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

async function parseEntries(entries) {
  await Promise.all(entries.map(async (file) => {
      const data = await fs.readFile(file, 'utf8');
      const json = await JSON.parse(data);
      const entry = json[Object.keys(json)[0]];
      const {img} = entry;
      const domain = path.parse(file).name;
      const imgPath = `icons/${img ? `${img[0]}/${img}`:`${domain[0]}/${domain}.svg`}`;

      try {
        await fs.readFile(imgPath);
        seenImages.push(imgPath);
      } catch (e) {
        if (!await alternativeSource(imgPath)) {
          core.error(`Image ${imgPath} not found.`, {file});
          errors = true;
        }
      }
    }),
  );
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
