# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/gottematias/antigravity-hud/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/gottematias/antigravity-hud/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/gottematias/antigravity-hud/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/gottematias/antigravity-hud/releases/tag/v1.0.0
