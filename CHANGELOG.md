# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Tokens and context always showing 0:** The HUD read field names Antigravity CLI never sends. `In`, `Out`, `Cache` and `Ctx` now come from `context_window` (`total_input_tokens`, `total_output_tokens`, `context_window_size`, `used_percentage`, `current_usage.cache_read_input_tokens`), so they refresh with every redraw. The previous flat `tokens` shape is kept as a fallback.
- **Cache hit rate:** The percentage is now computed against the same turn's full prompt (fresh input + cache creation + cache read) instead of the cumulative input total.
- **Null fields:** An explicit `null` or empty value in the payload falls through to the next candidate field instead of rendering `0`.

## [1.1.0] - 2026-10-22

### Added
- **3-Line Modular Architecture:** Box-connected 3-line layout (`┌─`, `├─`, `└─`) displaying account identity, thinking/reasoning effort, token stream, cache efficiency, and resource quotas.
- **Identity & Reasoning (Line 1):** Automatic Google account resolution (`👤 email`) and model thinking level badge (`🧠 High / Medium / Low`).
- **Token Stream & Delegation (Line 2):** Real-time background subagents tracking, prompt input tokens (`In`), candidate output tokens (`Out`), and Context Cache hit metrics (`⚡ Cache`).
- **Comprehensive Lifecycle State Icons:** Dedicated emojis and ANSI colors for all agent states (`⚡ IDLE`, `🧠 THINKING`, `✍ STREAMING`, `⚙ EXECUTING`, `🔧 TOOL`, `✋ CONFIRM`, `📦 COMPACTING`, `🔑 AUTH`, `❌ ERROR`).
- **Unified Telemetry Labels:** Consistent Cyan styling for resource telemetry labels (`Ctx:`, `5h:`, `Wk:`).

### Changed
- **Optimized Health Thresholds:** Realigned progress bar and quota warning colors (<75% green, 75%–89% yellow, ≥90% red).

## [1.0.2] - 2026-10-22

### Changed
- Updated `.gitignore` to exclude local agent tooling (`.atl/`, `.codegraph/`), environment configs, coverage outputs, and editor artifacts.

## [1.0.1] - 2026-10-22

### Added
- `scripts/release-check.js` (`npm run release:check -- vX.Y.Z`): verifies that a release tag matches `package.json`, `plugin.json` and a `CHANGELOG.md` section.

### Changed
- Release notes are now taken from the tagged `CHANGELOG.md` section instead of auto-generated PR titles.
- The installer keeps the first `settings.json.bak` instead of overwriting it on every install.
- `settings.json` is written atomically (temp file + rename) on install and uninstall, preserving symlinks and file permissions.

### Fixed
- Manual release runs (`workflow_dispatch`) now build and publish the requested tag instead of the branch they were started from.
- Uninstall no longer removes a `statusLine` configured by another tool, and creates `settings.json.bak` before modifying it when no backup exists yet.

### Removed
- Stale root `hud.js` copy (the maintained entry point is `bin/hud.js`) and the unused `DIM` constant.

## [1.0.0] - 2026-10-21

### Added
- **Structured 2-Line Dashboard (3.1):** Clean box-connector layout (`┌─` and `└─`) separating operational context from resource metrics.
- **Dual Official Quota Telemetry:**
  - 5-hour rolling window (`5h`) tracking consumed percentage, progress bar, and reset timer (`↻`).
  - Weekly rolling window (`Wk`) tracking consumed percentage, progress bar, and reset timer (`↻`).
- **Context Window Health:** Real-time token usage display (`<current>/<limit>`), percentage, and dynamic ANSI progress bar.
- **Dynamic Chromatic Health Indicators:** Color transitions based on consumption thresholds:
  - 🟢 Green (< 50% usage)
  - 🟡 Yellow (50% - 79% usage)
  - 🔴 Red (≥ 80% usage)
- **Multi-Platform Support:**
  - Native Windows launcher (`bin/hud.cmd`) with seamless child process wrapping.
  - Native POSIX shell launcher (`bin/hud.sh`) for macOS and Linux with automatic `node` resolution across Volta, NVM, FNM, and Homebrew.
  - Universal Node.js engine (`bin/hud.js`) with zero third-party npm dependencies (<5ms render latency).
- **Universal Installer Engine (`scripts/install.js`):**
  - Cross-platform detection and permission management (`chmod +x`).
  - Automatic backup of existing `settings.json` (`settings.json.bak`).
  - Safe rollback and uninstallation (`--uninstall`).
  - One-click PowerShell script (`scripts/install.ps1`) and shell script (`scripts/install.sh`).
- **Antigravity Native Plugin Manifest:** Complete and validated `plugin.json` compatible with `agy plugin install`.
- **Automated CI/CD Workflows:**
  - `ci.yml`: Multi-platform test matrix across Ubuntu, macOS, and Windows with Node.js 18, 20, and 22.
  - `release.yml`: Automated GitHub release pipeline triggered by version tags with ancestral verification from `main`.

[Unreleased]: https://github.com/gottematias/antigravity-hud/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/gottematias/antigravity-hud/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/gottematias/antigravity-hud/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/gottematias/antigravity-hud/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/gottematias/antigravity-hud/releases/tag/v1.0.0
