#!/usr/bin/env node

const fs = require('fs').promises;
const core = require('@actions/core');

/**
 * Fetch the categories from API repository.
 *
 * @returns {Promise<Object>} The parsed JSON object containing categories.
 * @throws Will throw an error if the fetch operation fails.
 */
async function fetchCategories() {
  const res = await fetch(
    'https://raw.githubusercontent.com/2factorauth/passkeys.2fa.directory/master/data/categories.json', {
      headers: {
        accept: 'application/json',
        'user-agent': '2factorauth/passkeys +https://2fa.directory/bots',
      },
    });

  if (!res.ok) throw new Error('Unable to fetch categories');

  return res.json();
}

/**
 * Validate a single file's categories against the allowed categories.
 *
 * @param {string} file - The path to the file to be validated.
 * @param {Array<string>} allowedCategories - The list of allowed category names.
 * @returns {Promise<boolean>} Returns true if an error occurred, false otherwise.
 */
async function validateFile(file, allowedCategories) {
  const data = await fs.readFile(file, 'utf8');
  const json = JSON.parse(data);
  const entry = json[Object.keys(json)[0]];
  let { categories } = entry;
  if (typeof categories === 'string') categories = [categories];

  for (const category of categories || []) {
    if (!allowedCategories.includes(category)) {
      core.error(`${category} is not a valid category.`, { file });
      return true; // Indicates an error occurred
    }
  }
  return false; // No errors
}

/**
 * Main function to fetch categories and validate all provided files.
 *
 * @returns {Promise<void>}
 */
async function main() {
  // Fetch the allowed categories
  const categoriesData = await fetchCategories();
  const allowedCategories = Object.keys(categoriesData);

  // Get the list of files from command-line arguments
  const files = process.argv.slice(2);

  // Validate each file in parallel
  const errors = await Promise.all(files.map(file => validateFile(file, allowedCategories)));

  // Exit with a status code of 1 if any errors occurred, otherwise 0
  process.exit(+errors.some(error => error));
}

// Export the main function for use as a module
module.exports = main;
