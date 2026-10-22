const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

console.log('Running release check test suite...');

const releaseScript = path.resolve(__dirname, '..', 'scripts', 'release-check.js');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-hud-release-'));

const CHANGELOG = [
  '# Changelog',
  '',
  '## [Unreleased]',
  '',
  '## [1.2.0] - 2026-10-22',
  '',
  '### Fixed',
  '- Something important.',
  '',
  '## [1.1.0] - 2026-10-01',
  '',
  '### Added',
  '- Older entry.',
  '',
  '[1.2.0]: https://example.com/v1.2.0',
  ''
].join('\n');

function writeFixture(version) {
  fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ version }), 'utf-8');
  fs.writeFileSync(path.join(tempDir, 'plugin.json'), JSON.stringify({ version }), 'utf-8');
  fs.writeFileSync(path.join(tempDir, 'CHANGELOG.md'), CHANGELOG, 'utf-8');
}

function runCheck(args) {
  return execFileSync('node', [releaseScript, ...args], {
    cwd: tempDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function expectFailure(args, expectedMessage) {
  try {
    runCheck(args);
  } catch (err) {
    assert.strictEqual(err.status, 1, 'Release check must exit with code 1');
    assert(err.stderr.includes(expectedMessage), `Expected "${expectedMessage}" in: ${err.stderr}`);
    return;
  }
  assert.fail(`Release check should have failed for: ${args.join(' ')}`);
}

try {
  // 1. Matching versions pass and the notes contain only the tagged section
  writeFixture('1.2.0');
  const notesPath = path.join(tempDir, 'notes.md');
  runCheck(['v1.2.0', '--notes', notesPath]);
  const notes = fs.readFileSync(notesPath, 'utf-8');
  assert(notes.includes('- Something important.'), 'Notes must include the tagged section');
  assert(!notes.includes('Older entry'), 'Notes must not include other versions');
  assert(!notes.includes('[1.2.0]:'), 'Notes must not include link references');
  console.log('✔ Matching versions and notes extraction verified');

  // 2. Invalid tag format
  expectFailure(['1.2.0'], 'Invalid tag');
  console.log('✔ Invalid tag rejected');

  // 3. Version mismatch in manifests
  writeFixture('1.1.0');
  expectFailure(['v1.2.0'], 'package.json version 1.1.0 does not match tag v1.2.0');
  console.log('✔ Manifest version mismatch rejected');

  // 4. Missing CHANGELOG section
  writeFixture('1.3.0');
  expectFailure(['v1.3.0'], 'CHANGELOG.md has no section for 1.3.0');
  console.log('✔ Missing CHANGELOG section rejected');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('\nRelease check tests passed successfully! 🚀');
