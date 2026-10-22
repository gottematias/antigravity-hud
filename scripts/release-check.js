#!/usr/bin/env node
/**
 * Release Consistency Check
 * Verifies that a release tag matches package.json, plugin.json and
 * CHANGELOG.md, and optionally extracts the tagged CHANGELOG section
 * as release notes.
 *
 * Usage: node scripts/release-check.js <vX.Y.Z> [--notes <output-file>]
 * Paths are resolved against the current working directory.
 */

const fs = require('fs');
const path = require('path');

const TAG_PATTERN = /^v(\d+\.\d+\.\d+)$/;

function fail(message) {
  console.error(`Release check failed: ${message}`);
  process.exit(1);
}

function readVersion(fileName) {
  const filePath = path.resolve(fileName);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')).version;
  } catch (e) {
    fail(`could not read ${fileName}: ${e.message}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns the body of the "## [version]" section, without its heading,
 * stopping at the next "## " heading or the link reference block.
 */
function extractChangelogSection(changelog, version) {
  const lines = changelog.split(/\r?\n/);
  const heading = new RegExp(`^## \\[${escapeRegExp(version)}\\]`);
  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) return null;

  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ') || /^\[[^\]]+\]:\s/.test(line)) break;
    body.push(line);
  }
  return body.join('\n').trim();
}

function main(args) {
  const tag = args[0];
  const match = TAG_PATTERN.exec(tag || '');
  if (!match) fail(`Invalid tag "${tag || ''}". Expected format vX.Y.Z`);
  const version = match[1];

  for (const manifest of ['package.json', 'plugin.json']) {
    const manifestVersion = readVersion(manifest);
    if (manifestVersion !== version) {
      fail(`${manifest} version ${manifestVersion} does not match tag ${tag}`);
    }
  }

  let changelog;
  try {
    changelog = fs.readFileSync(path.resolve('CHANGELOG.md'), 'utf-8');
  } catch (e) {
    fail(`could not read CHANGELOG.md: ${e.message}`);
  }
  const notes = extractChangelogSection(changelog, version);
  if (!notes) fail(`CHANGELOG.md has no section for ${version}`);

  const notesIndex = args.indexOf('--notes');
  if (notesIndex !== -1) {
    const notesPath = args[notesIndex + 1];
    if (!notesPath) fail('--notes requires an output file path');
    fs.writeFileSync(notesPath, `${notes}\n`, 'utf-8');
  }

  console.log(`✔ ${tag} matches package.json, plugin.json and CHANGELOG.md`);
}

main(process.argv.slice(2));
