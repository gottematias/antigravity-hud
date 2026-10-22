# Antigravity CLI Custom HUD

[![CI Validation](https://github.com/gottematias/antigravity-hud/actions/workflows/ci.yml/badge.svg)](https://github.com/gottematias/antigravity-hud/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/gottematias/antigravity-hud?color=brightgreen)](https://github.com/gottematias/antigravity-hud/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](package.json)

A lightweight, zero-dependency, structured 2-line status-line HUD for [Google Antigravity CLI](https://antigravity.google) tailored specifically for **subscription accounts**.

```text
┌─ [Gemini 3.8 Flash (High)] ── [AUTO] ── 📁 hexa-pos-backend ──  main ── [🤖 1 subagent] ── ⚡ IDLE
└─ Ctx: 45.2k/1.0M (4.3%) [█░░░░░░░] │ 5h: 18% [█░░░░░░░] ↻ 3h 10m │ Wk: 34% [███░░░░░] ↻ 4d 12h
```

---

## Why this HUD?

Standard status lines often clutter the display with dollar cost metrics that are irrelevant for subscription-tier plans, while hiding the metrics that actually matter: **quota expiration** and **context window limits**.

This HUD prioritizes:
1. **Context Window Health:** Know exactly when your context is saturating before the model starts losing focus.
2. **Dual Official Quotas:** Real-time visibility into both your 5-hour rolling limit and your weekly budget with reset countdowns (`↻`).
3. **Subagent Visibility:** Automatically tracks how many background subagents are executing in parallel.
4. **Zero Overhead:** Pure vanilla Node.js (<5ms execution time), no external npm dependencies, and no network blocking.

---

## Quick Installation

### Windows (PowerShell)
```powershell
git clone https://github.com/gottematias/antigravity-hud.git
cd antigravity-hud
.\scripts\install.ps1
```

### macOS & Linux
```bash
git clone https://github.com/gottematias/antigravity-hud.git
cd antigravity-hud
chmod +x ./scripts/install.sh
./scripts/install.sh
```

*Or install using npm:*
```bash
npm run install:hud
```

The installer automatically:
- Detects your platform and resolves the appropriate launcher.
- Grants execution permissions (`chmod +x`) on Unix systems.
- Creates a safety backup of your existing `settings.json` (`settings.json.bak`).
- Configures the `statusLine` command in Antigravity CLI.

---

## Manual Activation (Alternative)

You can also point Antigravity CLI to the launcher manually:

### Via Antigravity Slash Command:
- **Windows:**
  ```text
  /statusline "C:\path\to\antigravity-hud\bin\hud.cmd"
  ```
- **macOS / Linux:**
  ```text
  /statusline "/path/to/antigravity-hud/bin/hud.sh"
  ```

### Via `settings.json`:
Add to `~/.gemini/antigravity-cli/settings.json`:
```json
{
  "statusLine": {
    "type": "command",
    "command": "/path/to/antigravity-hud/bin/hud.sh"
  }
}
```

---

## Anatomy of the HUD

### Line 1: Operational Context
```text
┌─ [Gemini 3.8 Flash (High)] ── [AUTO] ── 📁 hexa-pos ──  main ── [🤖 1 subagent] ── ⚡ IDLE
```
- **Model:** Currently active LLM engine.
- **Mode:** Execution autonomy mode (`AUTO`, `PLAN`, `ACCEPT-EDITS`).
- **Workspace:** Current directory basename (`📁 hexa-pos`).
- **Git Branch:** Active repository branch (` main`).
- **Subagents:** Active concurrent background workers (auto-hides when 0).
- **Agent State:** Real-time state (`⚡ IDLE`, `⏳ THINKING`, `✍ STREAMING`, `✋ CONFIRM`).

### Line 2: Resource & Quota Telemetry
```text
└─ Ctx: 45.2k/1.0M (4.3%) [█░░░░░░░] │ 5h: 18% [█░░░░░░░] ↻ 3h 10m │ Wk: 34% [███░░░░░] ↻ 4d 12h
```
- **`Ctx` (Context Window):** Tokens used / total limit, percentage, and health bar.
- **`5h` (5-Hour Rolling Quota):** Consumed percentage, health bar, and reset countdown (`↻ 3h 10m`).
- **`Wk` (Weekly Quota):** Consumed percentage, health bar, and reset countdown (`↻ 4d 12h`).

### Color Thresholds
Progress bars shift color dynamically:
- 🟢 **Green:** < 50% usage (healthy)
- 🟡 **Yellow:** 50% – 79% usage (attention recommended)
- 🔴 **Red:** ≥ 80% usage (critical / nearing limit)

---

## Uninstallation

To revert to your previous status-line or remove the configuration:

```bash
npm run uninstall:hud
```
*Or on Windows PowerShell:*
```powershell
.\scripts\install.ps1 -Uninstall
```

---

## Documentation & Development

- [Changelog](CHANGELOG.md)

Run tests locally:
```bash
npm test
```

---

## License

[MIT](LICENSE) © 2026
