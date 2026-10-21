#!/usr/bin/env node
/**
 * Universal Installer for Antigravity CLI Custom HUD
 * Supports Windows, Linux, and macOS.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = process.platform === 'win32';
const homeDir = os.homedir();

function getSettingsPath() {
  if (process.env.AGY_SETTINGS_PATH) {
    return process.env.AGY_SETTINGS_PATH;
  }
  return path.join(homeDir, '.gemini', 'antigravity-cli', 'settings.json');
}

function getLauncherPath() {
  const rootDir = path.resolve(__dirname, '..');
  if (isWindows) {
    return path.join(rootDir, 'bin', 'hud.cmd');
  }
  return path.join(rootDir, 'bin', 'hud.sh');
}

function install() {
  const settingsPath = getSettingsPath();
  const launcherPath = getLauncherPath();

  console.log(`[1/3] Detecting platform... ${process.platform} (${os.arch()})`);
  console.log(`[2/3] Resolving launcher... ${launcherPath}`);

  if (!fs.existsSync(launcherPath)) {
    console.error(`Error: Launcher not found at ${launcherPath}`);
    process.exit(1);
  }

  // Ensure execution permissions on Unix
  if (!isWindows) {
    try {
      fs.chmodSync(launcherPath, 0o755);
      const scriptJs = path.join(path.dirname(launcherPath), 'hud.js');
      if (fs.existsSync(scriptJs)) {
        fs.chmodSync(scriptJs, 0o755);
      }
    } catch (e) {
      console.warn(`Warning: Could not set executable permissions: ${e.message}`);
    }
  }

  console.log(`[3/3] Configuring settings... ${settingsPath}`);

  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      const raw = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(raw || '{}');
      // Create backup
      fs.writeFileSync(`${settingsPath}.bak`, raw, 'utf-8');
      console.log(`  -> Created backup: ${settingsPath}.bak`);
    } catch (e) {
      console.error(`Error reading settings.json: ${e.message}`);
      process.exit(1);
    }
  } else {
    // Create directory if not exists
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  }

  // Configure statusLine
  settings.statusLine = {
    type: 'command',
    command: launcherPath
  };

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  console.log('\nSUCCESS! Antigravity HUD successfully installed.');
  console.log(`\nActive statusLine command set to:\n  ${launcherPath}\n`);
  console.log('You can also toggle or test it inside Antigravity CLI with:');
  console.log(`  /statusline "${launcherPath}"\n`);
}

function uninstall() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    console.log('No settings.json found. Nothing to uninstall.');
    return;
  }

  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(raw || '{}');
    if (settings.statusLine) {
      delete settings.statusLine;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      console.log('SUCCESS! statusLine configuration removed from settings.json.');
    } else {
      console.log('No statusLine configuration found in settings.json.');
    }
  } catch (e) {
    console.error(`Error uninstalling: ${e.message}`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.includes('--uninstall') || args.includes('-u')) {
  uninstall();
} else {
  install();
}
