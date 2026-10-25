# Antigravity CLI Custom HUD

[![CI Validation](https://github.com/gottematias/antigravity-hud/actions/workflows/ci.yml/badge.svg)](https://github.com/gottematias/antigravity-hud/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/gottematias/antigravity-hud?color=brightgreen)](https://github.com/gottematias/antigravity-hud/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](package.json)

A lightweight, zero-dependency, structured 3-line status-line HUD for [Google Antigravity CLI](https://antigravity.google) tailored specifically for **subscription accounts**.

```text
┌─ 👤 user@example.com                   │ [Gemini 3.8 Flash · 🧠 Medium] [AUTO]  │ ⚡ IDLE ── ⏱️ 1h 24m · 💤 hace 3m
├─ 🤖 1 subagent                         │    In:   38.2k    │    Out:   7.1k     │ ⚡ Cache:  14.5k ( 38%)
└─ Ctx:  45.2k/ 1.0M (  4.3%) [█░░░░░░░] │ 5h:  18% [█░░░░░░░] ↻  3h 10m          │ Wk:  34% [███░░░░░] ↻  4d 12h
```

---

## Why this HUD?

Standard status lines often clutter the display with dollar cost metrics that are irrelevant for subscription-tier plans, while hiding the metrics that actually matter: **quota expiration** and **context window limits**.

This HUD prioritizes:
1. **Vertical 3-Column Grid:** All 3 lines share identical column coordinates with aligned vertical dividers (`│`), eliminating horizontal jitter and giving a clear table-like scan.
2. **Context Window Health:** Know exactly when your context is saturating before the model starts losing focus.
3. **Dual Official Quotas:** Real-time visibility into both your 5-hour rolling limit and your weekly budget with reset countdowns (`↻`).
4. **Subagent Visibility & Token Flow:** Automatically tracks background subagents and balances In/Out tokens with a centered divider.
5. **Session & Activity Telemetry:** Continuous visibility into current session duration, turn execution time, and inactivity tracking without slowing down terminal rendering (<5ms).
6. **Zero Overhead:** Pure vanilla Node.js (<5ms execution time), no external npm dependencies, and no network blocking.

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

### Line 1: Identity, Engine & Status/Timing
```text
┌─ 👤 user@example.com                   │ [Gemini 3.8 Flash · 🧠 Medium] [AUTO]  │ ⚡ IDLE ── ⏱️ 1h 24m · 💤 hace 3m
```
- **Column 1 (Identity):** Active authenticated user email (`👤 email`).
- **Column 2 (Engine & Mode):** LLM engine, active thinking/reasoning effort badge (`🧠 High / Medium / Low`), and autonomy mode (`[AUTO]`, `[PLAN]`, `[ACCEPT-EDITS]`).
- **Column 3 (Lifecycle & Timing):**
  - Real-time agent lifecycle state (`⚡ IDLE`, `🧠 THINKING`, `✍ STREAMING`, `⚙ EXECUTING`, `🔧 TOOL`, `✋ CONFIRM`, `📦 COMPACTING`, `🔑 AUTH`, `❌ ERROR`).
  - Active turn counter when running or executing (`⚙ EXECUTING (18s)`).
  - Elapsed session duration (`⏱️ 1h 24m`) and inactivity counter (`💤 hace 3m`). Automatically drops the idle detail in narrow terminal viewports to prevent line wrap.

### Line 2: Delegation & Token Flow
```text
├─ 🤖 1 subagent                         │    In:   38.2k    │    Out:   7.1k     │ ⚡ Cache:  14.5k ( 38%)
```
- **Column 1 (Delegation):** Concurrently running delegated subagents (`🤖 0 subagents` when none).
- **Column 2 (Tokens In / Out):** Input prompt tokens and output candidate tokens separated by an exact midpoint vertical divider.
- **Column 3 (Cache Efficiency):** Reused cache reads and relative efficiency percentage (`⚡ Cache`).

### Line 3: Resource & Quota Telemetry
```text
└─ Ctx:  45.2k/ 1.0M (  4.3%) [█░░░░░░░] │ 5h:  18% [█░░░░░░░] ↻  3h 10m          │ Wk:  34% [███░░░░░] ↻  4d 12h
```
- **Column 1 (Context Window):** Tokens used / total limit, percentage, and health bar (`Ctx:`).
- **Column 2 (5-Hour Rolling Quota):** Consumed percentage, health bar, and reset countdown (`↻ 3h 10m`).
- **Column 3 (Weekly Quota):** Consumed percentage, health bar, and reset countdown (`↻ 4d 12h`).

### Color Thresholds
Progress bars and saturations shift color dynamically based on health thresholds:
- 🟢 **Green:** < 75% usage (healthy headroom)
- 🟡 **Yellow:** 75% – 89% usage (attention / threshold warning)
- 🔴 **Red:** ≥ 90% usage (critical / saturation alert)

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

The uninstaller only removes a `statusLine` that points to this HUD's launcher; a status line configured by another tool is left untouched. The first backup ever taken is kept at `settings.json.bak` and is never overwritten by later installs.

---

## Development & Contributing

- [Changelog](CHANGELOG.md)

### Branching & Contribution Workflow

1. **Base Branch:** Always create new feature or bugfix branches off `develop` (never `main`):
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name   # or fix/your-bug-fix
   ```

2. **Local Validation:** Ensure the entire test suite passes before committing or pushing:
   ```bash
   npm test
   ```

3. **Pull Request Target:** Open your PR targeting the `develop` branch. Automated CI validation will run lint checks and cross-platform matrix tests (Ubuntu, macOS, Windows across Node 18, 20, 22).

4. **Integration to Production:** Merges into `main` occur only when preparing an official release from `develop`.

### Releasing

1. Merge `develop` into `main`.
2. Bump `version` in both `package.json` and `plugin.json`, and move the `[Unreleased]` entries in `CHANGELOG.md` under a new `## [X.Y.Z]` heading.
3. Check consistency locally: `npm run release:check -- vX.Y.Z`
4. Tag `main` and push: `git tag vX.Y.Z && git push origin vX.Y.Z`

The release pipeline refuses tags that are not on `main` or whose version does not match both manifests and a `CHANGELOG.md` section, and it publishes that section as the release notes. Pre-release tags such as `v1.0.0-rc.1` are rejected. Uninstall only matches the launcher of the checkout it is run from, so run it from the same directory you installed from.

---

## License

[MIT](LICENSE) © 2026
