# Antigravity CLI Custom HUD

A lightweight, zero-dependency, 2-line status-line HUD for [Google Antigravity CLI](https://antigravity.google) designed specifically for **subscription accounts**.

```text
┌─ [Gemini 3.8 Flash (High)] ── [AUTO] ── 📁 hexa-pos-backend ──  main ── [🤖 1 subagent] ── ⚡ IDLE
└─ Ctx: 45.2k/1.0M (4.3%) [█░░░░░░░] │ 5h: 18% [█░░░░░░░] ↻ 3h 10m │ Wk: 34% [███░░░░░] ↻ 4d 12h
```

---

## Architecture & Features

- **Structured 2-Line Dashboard (Borders & Connectors):**
  - **Line 1 (Operational Context):** Active LLM model, execution cycle mode (`AUTO`, `PLAN`, `ACCEPT-EDITS`), workspace folder, Git branch, concurrent subagents count, and live agent state.
  - **Line 2 (Resource Telemetry):** Context window token usage + percentage + visual progress bar, 5-hour quota window + reset countdown, and weekly quota window + reset countdown.
- **Zero Cost Noise:** Financial dollar values are omitted for subscription users.
- **Dynamic Chromatic Health Indicators:**
  - 🟢 **Green:** Usage < 50%
  - 🟡 **Yellow:** Usage between 50% and 79%
  - 🔴 **Red:** Usage ≥ 80%
- **Cross-Platform:** Works seamlessly on **Windows**, **macOS**, and **Linux**.
- **Ultra-Fast Performance:** Pure vanilla Node.js, zero external npm dependencies, sub-5ms execution time.

---

## Directory Structure

```text
antigravity-hud/
├── bin/
│   ├── hud.js         # Core statusline renderer
│   ├── hud.cmd        # Windows launcher
│   └── hud.sh         # Linux / macOS POSIX launcher
├── scripts/
│   ├── install.js     # Universal cross-platform installer
│   ├── install.ps1    # One-click Windows PowerShell installer
│   └── install.sh     # One-click Linux / macOS installer
├── tests/
│   └── test.js        # Automated unit tests
├── .gitignore
├── LICENSE
├── package.json
├── plugin.json        # Antigravity native plugin manifest
└── README.md
```

---

## Installation

### Method 1: Automatic Installer (Recommended)

#### Windows (PowerShell):
```powershell
.\scripts\install.ps1
```
*Or via Node:*
```powershell
npm run install:hud
```

#### Linux & macOS:
```sh
chmod +x ./scripts/install.sh
./scripts/install.sh
```
*Or via Node:*
```sh
npm run install:hud
```

The installer detects your OS, resolves executable permissions, creates a backup of your `settings.json`, and registers the HUD automatically.

---

### Method 2: Native Antigravity Plugin Manager
Because this project contains a valid `plugin.json`, you can also install it directly via the Antigravity CLI:
```bash
agy plugin install .
```

---

### Method 3: Interactive Slash Command
Inside an active Antigravity CLI session, run:
- **Windows:**
  ```text
  /statusline "C:\Users\matia\antigravity-hud\bin\hud.cmd"
  ```
- **Linux / macOS:**
  ```text
  /statusline "/path/to/antigravity-hud/bin/hud.sh"
  ```

---

## Uninstallation

To restore your previous statusline configuration:

```bash
npm run uninstall:hud
```
*Or on Windows PowerShell:*
```powershell
.\scripts\install.ps1 -Uninstall
```

---

## Automated Tests

Run the test suite to verify token math, countdowns, and progress bars:
```bash
npm test
```

---

## Pushing to a Git Repository

When you are ready to move this project to GitHub or GitLab:

```bash
cd C:\Users\matia\antigravity-hud
git init
git add .
git commit -m "feat(hud): initial commit of cross-platform antigravity statusline hud"
git branch -M main
git remote add origin https://github.com/<your-username>/antigravity-hud.git
git push -u origin main
```
