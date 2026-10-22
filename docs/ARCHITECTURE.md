# Antigravity HUD Architecture & Technical Reference

This document provides a deep architectural overview of how Antigravity CLI interacts with custom status-line processes and how this HUD renders telemetry in real time.

---

## 1. Process Lifecycle & IPC Protocol

The status-line in Antigravity CLI is implemented as an external decoupled process communicated via standard streams (`stdin` / `stdout`).

```text
┌─────────────────────────────────┐
│     Antigravity CLI Core        │
└────────────────┬────────────────┘
                 │
                 │ 1. Spawns launcher on redraw event
                 │ 2. Injects JSON via stdin
                 ▼
┌─────────────────────────────────┐
│      hud.cmd / hud.sh           │  (Environment & runtime resolver)
└────────────────┬────────────────┘
                 │
                 │ 3. Execs Node runtime
                 ▼
┌─────────────────────────────────┐
│           hud.js                │  (Pure vanilla Node.js, <5ms)
│  - Parses JSON                  │
│  - Formats ANSI escape codes    │
│  - Emits 2-line layout          │
└────────────────┬────────────────┘
                 │
                 │ 4. Output emitted via stdout
                 ▼
┌─────────────────────────────────┐
│     Terminal Status Canvas      │
└─────────────────────────────────┘
```

### Execution Constraints:
- **Zero Blocking Network I/O:** The HUD is invoked frequently during terminal redraws. Network requests during rendering are strictly prohibited to prevent freezing the interactive CLI.
- **Sub-5ms Execution Target:** Designed with vanilla Node.js built-ins (`fs`, `path`) to eliminate npm module resolution overhead.

---

## 2. Ingested Payload Specification (`stdin`)

Antigravity CLI pipes a JSON object with the following schema:

```typescript
interface StatusLinePayload {
  terminal_width?: number;
  model?: {
    id?: string;
    display_name?: string;
  };
  cycle_mode?: "auto" | "plan" | "accept-edits";
  agent_state?: "idle" | "thinking" | "streaming" | "waiting_confirmation";
  cwd?: string;
  vcs?: {
    branch?: string;
  };
  subagents?: Record<string, { name?: string; status?: string }>;
  context_window?: {
    current?: number;
    limit?: number;
    percentage?: number;
  };
  quota?: {
    "gemini-5h"?: QuotaBucket;
    "gemini-weekly"?: QuotaBucket;
    "3p-5h"?: QuotaBucket;
    "3p-weekly"?: QuotaBucket;
  };
}

interface QuotaBucket {
  remaining_fraction?: number; // 0.0 to 1.0 (e.g. 0.82 = 82% remaining)
  reset_in_seconds?: number;   // Countdown in seconds until bucket refresh
  reset_time?: string;         // ISO timestamp
}
```

---

## 3. Telemetry Calculations & Formatting

### Context Window Math
- **Token Count:** Formatted as `45.2k` (for values ≥ 1,000) or `1.0M` (for values ≥ 1,000,000).
- **Percentage:** Direct percentage calculation: `(current / limit) * 100`.

### Quota Calculations
Antigravity reports `remaining_fraction` (the portion of quota still available). The HUD converts this into **consumed percentage**:
$$\text{Consumed Percentage} = \text{round}((1 - \text{remaining\_fraction}) \times 100)$$

### Countdown Durations
Seconds remaining are transformed into compact human-readable duration strings:
- $> 1 \text{ day}$: `4d 12h`
- $> 1 \text{ hour}$: `3h 15m`
- $\le 1 \text{ hour}$: `42m`

---

## 4. Chromatic Threshold Engine

Progress bars transition dynamically based on consumption levels:

| Threshold | Color | ANSI Code | Meaning |
| :--- | :--- | :--- | :--- |
| **0% – 49%** | 🟢 Green | `\x1b[32m` | Healthy / Ample quota available |
| **50% – 79%** | 🟡 Yellow | `\x1b[33m` | Moderate / Attention recommended |
| **80% – 100%** | 🔴 Red | `\x1b[31m` | Critical / Nearing quota limit or compaction threshold |

---

## 5. Responsive Terminal Adaptation

When `terminal_width < 95`, the HUD automatically compresses progress bars from 8 blocks to 6 blocks:
- Normal (≥ 95 cols): `[██░░░░░░]` (8 blocks)
- Narrow (< 95 cols): `[█░░░░░]` (6 blocks)
