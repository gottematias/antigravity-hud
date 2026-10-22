const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

console.log('Running installer test suite...');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-hud-test-'));
const mockSettingsPath = path.join(tempDir, 'settings.json');
const installScript = path.resolve(__dirname, '..', 'scripts', 'install.js');

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

} finally {
  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('\nInstaller tests passed successfully! 🚀');
