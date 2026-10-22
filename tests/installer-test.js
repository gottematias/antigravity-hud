const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

console.log('Running installer test suite...');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-hud-test-'));
const mockSettingsPath = path.join(tempDir, 'settings.json');
const installScript = path.resolve(__dirname, '..', 'scripts', 'install.js');

function runInstaller(args) {
  return execFileSync('node', [installScript, ...args], {
    env: { ...process.env, AGY_SETTINGS_PATH: mockSettingsPath },
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

try {
  // 1. Initial State: Mock pre-existing settings with another setting
  const initialSettings = { allowNonWorkspaceAccess: true };
  fs.writeFileSync(mockSettingsPath, JSON.stringify(initialSettings, null, 2), 'utf-8');

  // 2. Run installer targeting mock settings
  console.log('Testing install...');
  execFileSync('node', [installScript], {
    env: { ...process.env, AGY_SETTINGS_PATH: mockSettingsPath }
  });

  assert(fs.existsSync(mockSettingsPath), 'Mock settings file should exist');
  assert(fs.existsSync(`${mockSettingsPath}.bak`), 'Backup file should have been created');

  const installedSettings = JSON.parse(fs.readFileSync(mockSettingsPath, 'utf-8'));
  assert(installedSettings.statusLine, 'statusLine key must exist');
  assert.strictEqual(installedSettings.statusLine.type, 'command');
  assert(typeof installedSettings.statusLine.command === 'string' && installedSettings.statusLine.command.length > 0);
  assert.strictEqual(installedSettings.allowNonWorkspaceAccess, true, 'Pre-existing keys must be preserved');
  console.log('✔ Install verified');

  // 3. Run uninstaller
  console.log('Testing uninstall...');
  execFileSync('node', [installScript, '--uninstall'], {
    env: { ...process.env, AGY_SETTINGS_PATH: mockSettingsPath }
  });

  const uninstalledSettings = JSON.parse(fs.readFileSync(mockSettingsPath, 'utf-8'));
  assert.strictEqual(uninstalledSettings.statusLine, undefined, 'statusLine should be removed after uninstall');
  assert.strictEqual(uninstalledSettings.allowNonWorkspaceAccess, true, 'Other keys must remain intact');
  console.log('✔ Uninstall verified');

  // 4. Reinstalling must keep the original backup instead of overwriting it
  console.log('Testing backup preservation...');
  const originalBackup = fs.readFileSync(`${mockSettingsPath}.bak`, 'utf-8');
  runInstaller([]);
  runInstaller([]);
  assert.strictEqual(fs.readFileSync(`${mockSettingsPath}.bak`, 'utf-8'), originalBackup, 'Existing backup must not be overwritten');
  assert(!fs.existsSync(`${mockSettingsPath}.tmp`), 'Atomic write must not leave a temp file behind');
  console.log('✔ Backup preservation verified');

  // 5. Uninstall must leave a statusLine owned by another tool untouched
  console.log('Testing foreign statusLine protection...');
  const foreignStatusLine = { type: 'command', command: '/usr/local/bin/other-statusline' };
  fs.writeFileSync(mockSettingsPath, JSON.stringify({ statusLine: foreignStatusLine }, null, 2), 'utf-8');
  const output = runInstaller(['--uninstall']);
  const foreignSettings = JSON.parse(fs.readFileSync(mockSettingsPath, 'utf-8'));
  assert.deepStrictEqual(foreignSettings.statusLine, foreignStatusLine, 'Foreign statusLine must be preserved');
  assert(output.includes('not managed by Antigravity HUD'), 'Uninstall must explain why it skipped the foreign statusLine');
  console.log('✔ Foreign statusLine protection verified');

  // 6. Uninstall creates a backup when none exists yet
  console.log('Testing uninstall backup...');
  fs.rmSync(`${mockSettingsPath}.bak`);
  runInstaller([]);
  fs.rmSync(`${mockSettingsPath}.bak`);
  const beforeUninstall = fs.readFileSync(mockSettingsPath, 'utf-8');
  runInstaller(['--uninstall']);
  assert.strictEqual(fs.readFileSync(`${mockSettingsPath}.bak`, 'utf-8'), beforeUninstall, 'Uninstall must back up settings when no backup exists');
  console.log('✔ Uninstall backup verified');

  // 7. A symlinked settings.json keeps its link and its permissions
  const linkTarget = path.join(tempDir, 'dotfiles-settings.json');
  fs.writeFileSync(linkTarget, '{}', 'utf-8');
  fs.rmSync(mockSettingsPath);
  let canSymlink = true;
  try {
    fs.symlinkSync(linkTarget, mockSettingsPath);
  } catch (e) {
    canSymlink = false; // Windows without symlink privilege
  }
  if (canSymlink) {
    console.log('Testing symlink and permission preservation...');
    if (process.platform !== 'win32') fs.chmodSync(linkTarget, 0o600);
    runInstaller([]);
    assert(fs.lstatSync(mockSettingsPath).isSymbolicLink(), 'settings.json symlink must be preserved');
    assert(JSON.parse(fs.readFileSync(linkTarget, 'utf-8')).statusLine, 'Symlink target must receive the update');
    if (process.platform !== 'win32') {
      assert.strictEqual(fs.statSync(linkTarget).mode & 0o777, 0o600, 'File permissions must be preserved');
    }
    console.log('✔ Symlink and permission preservation verified');
  } else {
    console.log('- Skipping symlink test (no symlink privilege)');
  }
  fs.rmSync(mockSettingsPath, { force: true });
  fs.writeFileSync(mockSettingsPath, '{}', 'utf-8');

  // 8. A corrupted settings.json must abort without being overwritten
  console.log('Testing corrupted settings protection...');
  fs.writeFileSync(mockSettingsPath, '{ not json', 'utf-8');
  assert.throws(() => runInstaller([]), 'Installer must fail on invalid JSON');
  assert.strictEqual(fs.readFileSync(mockSettingsPath, 'utf-8'), '{ not json', 'Corrupted settings must be left untouched');
  console.log('✔ Corrupted settings protection verified');

} finally {
  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('\nInstaller tests passed successfully! 🚀');
