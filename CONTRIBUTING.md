# Contributing to Antigravity HUD

Thank you for contributing to Antigravity HUD! This document outlines our branch strategy, development workflow, and coding guidelines.

---

## 1. Branch Strategy

We follow a strict **Trunk-Based / Git Flow** hybrid model:

```text
feature/* ──> [PR + CI Checks] ──> develop ──> [PR develop -> main] ──> main ──> [Tag v*.*.*]
```

- **`develop`:** Active development branch. All feature branches and bugfixes target this branch. Direct pushes are restricted; all changes require an approved Pull Request.
- **`main`:** Production-ready branch. Releases and distribution packages originate exclusively from `main`.
- **Feature Branches:** Create descriptive branches prefixed with `feature/`, `fix/`, `docs/`, or `refactor/` (e.g., `feature/custom-colors`).

---

## 2. Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gottematias/antigravity-hud.git
   cd antigravity-hud
   git checkout develop
   ```

2. **Run Tests:**
   This project uses zero external npm dependencies. You do not need to run `npm install`.
   ```bash
   npm test
   ```

3. **Test the HUD locally with simulated payloads:**
   - **Windows:**
     ```powershell
     '{"model":{"display_name":"Gemini 3.8 Flash"},"cycle_mode":"auto","context_window":{"current":50000,"limit":1048576},"quota":{"gemini-5h":{"remaining_fraction":0.85,"reset_in_seconds":7200}}}' | .\bin\hud.cmd
     ```
   - **macOS / Linux:**
     ```bash
     echo '{"model":{"display_name":"Gemini 3.8 Flash"},"cycle_mode":"auto","context_window":{"current":50000,"limit":1048576},"quota":{"gemini-5h":{"remaining_fraction":0.85,"reset_in_seconds":7200}}}' | ./bin/hud.sh
     ```

---

## 3. Commit Guidelines

We enforce [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` A new feature or user-facing capability.
- `fix:` A bug fix.
- `docs:` Documentation updates only.
- `refactor:` Code change that neither fixes a bug nor adds a feature.
- `test:` Adding or updating tests.
- `ci:` Changes to CI/CD workflows and scripts.

---

## 4. Pull Request & CI Verification

Every Pull Request must pass the automated GitHub Actions CI matrix:
- **Lint & Syntax:** JSON validity checks (`package.json`, `plugin.json`) and POSIX shell syntax (`sh -n`).
- **Cross-Platform Matrix:** Automated testing across **Ubuntu**, **macOS**, and **Windows** on Node.js `18.x`, `20.x`, and `22.x`.
- **Installer Test:** Automated dry-run install and rollback verification.

---

## 5. Release Procedure

1. Merge `develop` into `main` via a Pull Request.
2. Tag the release commit on `main`:
   ```bash
   git checkout main
   git pull origin main
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
3. The Release Pipeline (`release.yml`) will verify that the tag originates from `main`, build distribution archives (`.tar.gz` and `.zip`), calculate SHA-256 checksums, and publish the release.
