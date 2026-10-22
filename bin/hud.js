#!/usr/bin/env node
/**
 * Antigravity CLI Custom HUD (Status Line)
 * Architecture: Clean 3-line Dashboard with Box Connectors (3.1)
 * Line 1: Account ── Model + Reasoning ── Mode ── Agent State
 * Line 2: Subagents ── Tokens In / Out ── Context Cache
 * Line 3: Context Window ── 5h Rolling Quota ── Weekly Budget
 * Cross-platform: Windows, Linux, macOS.
 * Zero external dependencies, ultra-fast execution (<5ms).
 */

const fs = require('fs');
const path = require('path');

// ANSI Color & Formatting Constants
const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;

const RED = `${ESC}31m`;
const GREEN = `${ESC}32m`;
const YELLOW = `${ESC}33m`;
const BLUE = `${ESC}34m`;
const MAGENTA = `${ESC}35m`;
const CYAN = `${ESC}36m`;
const GRAY = `${ESC}90m`;

/**
 * Builds an ANSI-colored progress bar.
 * Dynamically shifts from green -> yellow (>=75%) -> red (>=90%) based on usage threshold.
 */
function makeBar(percent, width = 8) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  let filled = Math.round((p / 100) * width);
  if (p > 0 && filled === 0) filled = 1; // Indicate non-zero activity with at least 1 block
  const empty = Math.max(0, width - filled);

  let barColor = GREEN;
  if (p >= 90) {
    barColor = RED;
  } else if (p >= 75) {
    barColor = YELLOW;
  }

  return `${barColor}${'█'.repeat(filled)}${GRAY}${'░'.repeat(empty)}${RESET}`;
}

/**
 * Formats token counts into compact notation (e.g. 42.1k, 1.0M).
 */
function formatTokens(count) {
  const n = Number(count) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

/**
 * Formats countdown seconds into compact duration notation (e.g. 3h 15m, 4d 12h).
 */
function formatResetDuration(seconds) {
  const s = Number(seconds) || 0;
  if (s <= 0) return '';
  let totalMinutes = Math.floor(s / 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  totalMinutes -= days * 24 * 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Resolves active account email from payload or local config.
 */
function resolveAccount(data) {
  if (data.user && typeof data.user === 'object' && data.user.email) {
    return data.user.email;
  }
  if (data.account && typeof data.account === 'string') {
    return data.account;
  }
  if (data.email && typeof data.email === 'string') {
    return data.email;
  }
  try {
    const homedir = process.env.HOME || process.env.USERPROFILE || '';
    if (homedir) {
      const accPath = path.join(homedir, '.gemini', 'google_accounts.json');
      if (fs.existsSync(accPath)) {
        const raw = fs.readFileSync(accPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.active) return parsed.active;
      }
    }
  } catch (_) {}
  return '';
}

/**
 * Extracts and formats model display name along with thinking / reasoning level.
 */
function resolveModelAndReasoning(data) {
  const rawModel = data.model?.display_name || data.model?.id || 'Gemini';
  const match = rawModel.match(/^(.*?)\s*\((High|Medium|Low|None)\)$/i);
  let baseName = rawModel;
  let reasoning = '';

  if (match) {
    baseName = match[1].trim();
    reasoning = match[2];
  } else if (data.reasoning_effort || data.model?.thinking) {
    reasoning = data.reasoning_effort || data.model?.thinking;
  }

  if (reasoning) {
    return `${baseName} · 🧠 ${reasoning}`;
  }
  return baseName;
}

/**
 * Main Statusline Renderer (3-Line Modular Architecture)
 */
function render(data) {
  const termWidth = Number(data.terminal_width) || 120;
  const isNarrow = termWidth < 95;
  const barLen = isNarrow ? 6 : 8;

  // --- LINE 1: IDENTITY, CEREBRO Y ESTADO ---
  const account = resolveAccount(data);
  const segAccount = account ? `${CYAN}👤 ${account}${RESET}` : '';

  const modelFormatted = resolveModelAndReasoning(data);
  const segModel = `${CYAN}${BOLD}[${modelFormatted}]${RESET}`;

  const mode = (data.cycle_mode || 'auto').toUpperCase();
  const segMode = `${YELLOW}[${mode}]${RESET}`;

  const stateMap = {
    idle: `${GREEN}⚡ IDLE${RESET}`,
    thinking: `${YELLOW}🧠 THINKING${RESET}`,
    streaming: `${CYAN}✍ STREAMING${RESET}`,
    waiting_confirmation: `${MAGENTA}✋ CONFIRM${RESET}`,
    confirm: `${MAGENTA}✋ CONFIRM${RESET}`,
    executing: `${BLUE}⚙ EXECUTING${RESET}`,
    running: `${BLUE}⚙ RUNNING${RESET}`,
    tool: `${BLUE}🔧 TOOL${RESET}`,
    compacting: `${CYAN}📦 COMPACTING${RESET}`,
    authenticating: `${YELLOW}🔑 AUTH${RESET}`,
    error: `${RED}❌ ERROR${RESET}`
  };
  const normalizedState = (data.agent_state || 'idle').toLowerCase().trim();
  const agentState = stateMap[normalizedState] || `${GRAY}● ${(data.agent_state || 'IDLE').toUpperCase()}${RESET}`;

  const l1Parts = [segAccount, segModel, segMode, agentState].filter(Boolean);
  const line1 = `${GRAY}┌─ ${RESET}${l1Parts.join(`${GRAY} ── ${RESET}`)}`;

  // --- LINE 2: SUBAGENTS, TOKENS IN/OUT & CACHE ---
  let subagentsCount = 0;
  if (data.subagents && typeof data.subagents === 'object') {
    subagentsCount = Object.keys(data.subagents).length;
  }
  const subagentsLabel = subagentsCount === 1 ? '1 subagent' : `${subagentsCount} subagents`;
  const segSubagents = subagentsCount > 0
    ? `${BLUE}🤖 ${subagentsLabel}${RESET}`
    : `${GRAY}🤖 0 subagents${RESET}`;

  const tokens = data.tokens || data.token_usage || {};
  const inTokens = Number(tokens.input ?? tokens.prompt ?? tokens.prompt_tokens ?? data.context_window?.current ?? 0);
  const outTokens = Number(tokens.output ?? tokens.completion ?? tokens.candidates ?? tokens.completion_tokens ?? 0);
  const segTokens = `${CYAN}In:${RESET} ${formatTokens(inTokens)} ${GRAY}│${RESET} ${MAGENTA}Out:${RESET} ${formatTokens(outTokens)}`;

  const cacheTokens = Number(tokens.cached ?? tokens.cache_read ?? data.cache?.tokens ?? 0);
  const cachePct = inTokens > 0 && cacheTokens > 0 ? Math.round((cacheTokens / inTokens) * 100) : 0;
  const segCache = `${YELLOW}⚡ Cache:${RESET} ${formatTokens(cacheTokens)}${cacheTokens > 0 ? ` (${cachePct}%)` : ''}`;

  const l2Parts = [segSubagents, segTokens, segCache];
  const line2 = `${GRAY}├─ ${RESET}${l2Parts.join(`${GRAY} ── ${RESET}`)}`;

  // --- LINE 3: RESOURCE TELEMETRY (Context + 5h Quota + Weekly Quota) ---
  const ctx = data.context_window || {};
  const currentTokens = Number(ctx.current) || 0;
  const limitTokens = Number(ctx.limit) || 1048576;
  const ctxPct = typeof ctx.percentage === 'number'
    ? ctx.percentage
    : (limitTokens > 0 ? (currentTokens / limitTokens) * 100 : 0);

  const ctxFormatted = `${formatTokens(currentTokens)}/${formatTokens(limitTokens)}`;
  const segContext = `${GREEN}Ctx:${RESET} ${ctxFormatted} (${ctxPct.toFixed(1)}%) [${makeBar(ctxPct, barLen)}]`;

  const quotas = data.quota || {};
  const q5h = quotas['gemini-5h'] || quotas['3p-5h'] || null;
  const qWeek = quotas['gemini-weekly'] || quotas['3p-weekly'] || null;

  // 5-Hour Window Segment
  let seg5h = '';
  if (q5h && typeof q5h.remaining_fraction === 'number') {
    const used5h = Math.round((1 - q5h.remaining_fraction) * 100);
    const reset5h = formatResetDuration(q5h.reset_in_seconds);
    const resetLabel = reset5h ? ` ${GRAY}↻ ${reset5h}${RESET}` : '';
    seg5h = `${CYAN}5h:${RESET} ${used5h}% [${makeBar(used5h, barLen)}]${resetLabel}`;
  } else {
    seg5h = `${CYAN}5h:${RESET} 0% [${makeBar(0, barLen)}]`;
  }

  // Weekly Window Segment
  let segWeek = '';
  if (qWeek && typeof qWeek.remaining_fraction === 'number') {
    const usedW = Math.round((1 - qWeek.remaining_fraction) * 100);
    const resetW = formatResetDuration(qWeek.reset_in_seconds);
    const resetLabel = resetW ? ` ${GRAY}↻ ${resetW}${RESET}` : '';
    segWeek = `${YELLOW}Wk:${RESET} ${usedW}% [${makeBar(usedW, barLen)}]${resetLabel}`;
  } else {
    segWeek = `${YELLOW}Wk:${RESET} 0% [${makeBar(0, barLen)}]`;
  }

  const l3Parts = [segContext, seg5h, segWeek];
  const line3 = `${GRAY}└─ ${RESET}${l3Parts.join(`${GRAY} │ ${RESET}`)}`;

  return `${line1}\n${line2}\n${line3}`;
}

// Module Export for Automated Tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    render,
    makeBar,
    formatTokens,
    formatResetDuration,
    resolveAccount,
    resolveModelAndReasoning
  };
}

// Direct Execution Entrypoint
if (require.main === module) {
  try {
    const input = fs.readFileSync(0, 'utf-8');
    if (!input || !input.trim()) {
      process.stdout.write(`┌─ [Antigravity CLI]\n├─ 🤖 0 subagents ── In: 0 │ Out: 0 ── ⚡ Cache: 0\n└─ Ctx: 0% [░░░░░░░░] │ 5h: 0% [░░░░░░░░] │ Wk: 0% [░░░░░░░░]`);
      process.exit(0);
    }

    const payload = JSON.parse(input);
    const output = render(payload);
    process.stdout.write(output);
  } catch (err) {
    process.stdout.write(`┌─ [Antigravity CLI] (init)\n├─ 🤖 0 subagents ── In: 0 │ Out: 0 ── ⚡ Cache: 0\n└─ Ctx: [░░░░░░░░] │ 5h: [░░░░░░░░] │ Wk: [░░░░░░░░]`);
  }
}
