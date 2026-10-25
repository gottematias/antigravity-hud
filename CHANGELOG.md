# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Vertical 3-column grid alignment:** Restructured all 3 lines into an aligned table matrix with shared column boundaries and vertically aligned `│` dividers across identity, engine/tokens, and status/quotas.
- **Centered In/Out divider:** Positioned the internal separator of Column 2 (tokens In and Out) at the exact mathematical midpoint.
- **Session and activity telemetry in Line 1:** Real-time tracking of current session duration (`⏱️`), active turn execution duration (`⚙ EXECUTING (18s)`), and idle elapsed time (`💤 hace 3m`) with automatic condensation for narrow terminal viewports.
- **Lightweight multi-session tracking:** Sub-millisecond state persistence via `os.tmpdir()` with automatic session boundary detection (session ID change, context window reset, or 30-minute inactivity timeout).
- **Fixed-width column alignment:** Padded value slots across Line 2 (subagents, tokens in/out, cache) and Line 3 (context window, 5h rolling quota, weekly quota, countdown timers) to eliminate horizontal jitter and preserve static column positions across updates.

## [1.1.1] - 2026-10-22

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

## [1.0.0] - 2026-10-22

### Added
- Initial release of Antigravity HUD for Google Antigravity CLI.
- 3-line box connected terminal UI dashboard with context window metrics and official rolling quotas.
