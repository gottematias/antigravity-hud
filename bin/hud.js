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
 * Returns the first candidate that is a usable number, skipping null/undefined/''/NaN.
 * Unlike `??`, an explicit null or empty value falls through to the next candidate.
 */
function firstNumber(...candidates) {
  for (const value of candidates) {
    if (value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return 0;
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
  const rawSubLabel = subagentsCount === 1 ? '1 subagent' : `${subagentsCount} subagents`;
  const subagentsLabel = rawSubLabel.padEnd(11);
  const segSubagents = subagentsCount > 0
    ? `${BLUE}🤖 ${subagentsLabel}${RESET}`
    : `${GRAY}🤖 ${subagentsLabel}${RESET}`;

  // Antigravity CLI sends token counters under context_window (total_*, current_usage);
  // the flat `tokens` shape is kept as a fallback.
  const ctx = data.context_window || {};
  const tokens = data.tokens || data.token_usage || {};
  const inTokens = firstNumber(ctx.total_input_tokens, tokens.input, tokens.prompt, tokens.prompt_tokens, ctx.current);
  const outTokens = firstNumber(ctx.total_output_tokens, tokens.output, tokens.completion, tokens.candidates, tokens.completion_tokens);
  const segInVal = formatTokens(inTokens).padStart(6);
  const segOutVal = formatTokens(outTokens).padStart(6);
  const segTokens = `${CYAN}In:${RESET} ${segInVal} ${GRAY}│${RESET} ${MAGENTA}Out:${RESET} ${segOutVal}`;

  const usage = ctx.current_usage || {};
  const cacheTokens = firstNumber(usage.cache_read_input_tokens, tokens.cached, tokens.cache_read, data.cache?.tokens);
  // Hit rate must compare against the same turn's full prompt (fresh + cache creation + cache read);
  // total_input_tokens is a different, larger base. Without current_usage, fall back to inTokens.
  const turnPrompt = firstNumber(usage.input_tokens) + firstNumber(usage.cache_creation_input_tokens) + cacheTokens;
  const cacheBase = usage.cache_read_input_tokens != null && turnPrompt > 0 ? turnPrompt : inTokens;
  const cachePct = cacheBase > 0 && cacheTokens > 0 ? Math.round((cacheTokens / cacheBase) * 100) : 0;
  const segCacheVal = formatTokens(cacheTokens).padStart(6);
  const segCachePct = `${String(cachePct).padStart(3)}%`;
  const segCache = `${YELLOW}⚡ Cache:${RESET} ${segCacheVal} (${segCachePct})`;

  const l2Parts = [segSubagents, segTokens, segCache];
  const line2 = `${GRAY}├─ ${RESET}${l2Parts.join(`${GRAY} ── ${RESET}`)}`;

  // --- LINE 3: RESOURCE TELEMETRY (Context + 5h Quota + Weekly Quota) ---
  const currentTokens = firstNumber(ctx.total_input_tokens, ctx.current);
  const limitTokens = firstNumber(ctx.context_window_size, ctx.limit) || 1048576;
  const reportedPct = [ctx.used_percentage, ctx.percentage].find((p) => typeof p === 'number');
  const ctxPct = reportedPct !== undefined
    ? reportedPct
    : (limitTokens > 0 ? (currentTokens / limitTokens) * 100 : 0);

  const curTokFormatted = formatTokens(currentTokens).padStart(6);
  const limTokFormatted = formatTokens(limitTokens).padStart(5);
  const pctCtxFormatted = `${ctxPct.toFixed(1).padStart(5)}%`;
  const segContext = `${CYAN}Ctx:${RESET} ${curTokFormatted}/${limTokFormatted} (${pctCtxFormatted}) [${makeBar(ctxPct, barLen)}]`;

  const quotas = data.quota || {};
  const q5h = quotas['gemini-5h'] || quotas['3p-5h'] || null;
  const qWeek = quotas['gemini-weekly'] || quotas['3p-weekly'] || null;

  // 5-Hour Window Segment
  const has5h = q5h && typeof q5h.remaining_fraction === 'number';
  const used5h = has5h ? Math.round((1 - q5h.remaining_fraction) * 100) : 0;
  const reset5h = has5h ? formatResetDuration(q5h.reset_in_seconds) : '';
  const used5hStr = `${String(used5h).padStart(3)}%`;
  const resetLabel5h = reset5h
    ? ` ${GRAY}↻ ${reset5h.padStart(7)}${RESET}`
    : '          ';
  const seg5h = `${CYAN}5h:${RESET} ${used5hStr} [${makeBar(used5h, barLen)}]${resetLabel5h}`;

  // Weekly Window Segment
  const hasWeek = qWeek && typeof qWeek.remaining_fraction === 'number';
  const usedW = hasWeek ? Math.round((1 - qWeek.remaining_fraction) * 100) : 0;
  const resetW = hasWeek ? formatResetDuration(qWeek.reset_in_seconds) : '';
  const usedWStr = `${String(usedW).padStart(3)}%`;
  const resetLabelW = resetW
    ? ` ${GRAY}↻ ${resetW.padStart(7)}${RESET}`
    : '';
  const segWeek = `${CYAN}Wk:${RESET} ${usedWStr} [${makeBar(usedW, barLen)}]${resetLabelW}`;

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
      process.stdout.write(render({}));
      process.exit(0);
    }

    const payload = JSON.parse(input);
    const output = render(payload);
    process.stdout.write(output);
  } catch (err) {
    process.stdout.write(render({}));
  }
}
