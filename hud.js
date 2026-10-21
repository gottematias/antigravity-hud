#!/usr/bin/env node
/**
 * Antigravity CLI Custom HUD (Status Line)
 * Architecture: Clean 2-line Dashboard with Box Connectors (3.1)
 * Optimized for Windows, zero external dependencies, ultra-fast execution (<5ms).
 */

const fs = require('fs');
const path = require('path');

// ANSI Color & Formatting Constants
const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;

const RED = `${ESC}31m`;
const GREEN = `${ESC}32m`;
const YELLOW = `${ESC}33m`;
const BLUE = `${ESC}34m`;
const MAGENTA = `${ESC}35m`;
const CYAN = `${ESC}36m`;
const GRAY = `${ESC}90m`;

/**
 * Builds an ANSI-colored progress bar.
 * Dynamically shifts from green -> yellow -> red based on usage threshold.
 */
function makeBar(percent, width = 8) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  let filled = Math.round((p / 100) * width);
  if (p > 0 && filled === 0) filled = 1; // Indicate non-zero activity with at least 1 block
  const empty = Math.max(0, width - filled);

  let barColor = GREEN;
  if (p >= 80) {
    barColor = RED;
  } else if (p >= 50) {
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
 * Main Statusline Renderer
 */
function render(data) {
  const termWidth = Number(data.terminal_width) || 120;
  const isNarrow = termWidth < 95;
  const barLen = isNarrow ? 6 : 8;

  // --- LINE 1: OPERATIONAL CONTEXT ---
  const modelName = data.model?.display_name || data.model?.id || 'Gemini';
  const mode = (data.cycle_mode || 'auto').toUpperCase();
  const folder = data.cwd ? path.basename(data.cwd) : '';
  const branch = data.vcs?.branch || '';

  // Subagents count
  let subagentsCount = 0;
  if (data.subagents && typeof data.subagents === 'object') {
    subagentsCount = Object.keys(data.subagents).length;
  }

  // Agent State
  const stateMap = {
    idle: `${GREEN}⚡ IDLE${RESET}`,
    thinking: `${YELLOW}⏳ THINKING${RESET}`,
    streaming: `${CYAN}✍ STREAMING${RESET}`,
    waiting_confirmation: `${MAGENTA}✋ CONFIRM${RESET}`
  };
  const agentState = stateMap[data.agent_state] || `${GRAY}● ${data.agent_state || 'IDLE'}${RESET}`;

  const segModel = `${CYAN}${BOLD}[${modelName}]${RESET}`;
  const segMode = `${YELLOW}[${mode}]${RESET}`;
  const segFolder = folder ? `${BLUE}📁 ${folder}${RESET}` : '';
  const segBranch = branch ? `${MAGENTA} ${branch}${RESET}` : '';
  const segAgents = subagentsCount > 0 ? `${BLUE}[🤖 ${subagentsCount} ${subagentsCount === 1 ? 'subagent' : 'subagents'}]${RESET}` : '';

  const l1Parts = [segModel, segMode, segFolder, segBranch, segAgents, agentState].filter(Boolean);
  const line1 = `${GRAY}┌─ ${RESET}${l1Parts.join(`${GRAY} ── ${RESET}`)}`;

  // --- LINE 2: RESOURCE TELEMETRY (Context + 5h Quota + Weekly Quota) ---
  // 1. Context Window (used tokens / limit, percentage, progress bar)
  const ctx = data.context_window || {};
  const currentTokens = Number(ctx.current) || 0;
  const limitTokens = Number(ctx.limit) || 1048576;
  const ctxPct = typeof ctx.percentage === 'number'
    ? ctx.percentage
    : (limitTokens > 0 ? (currentTokens / limitTokens) * 100 : 0);

  const ctxFormatted = `${formatTokens(currentTokens)}/${formatTokens(limitTokens)}`;
  const segContext = `${GREEN}Ctx:${RESET} ${ctxFormatted} (${ctxPct.toFixed(1)}%) [${makeBar(ctxPct, barLen)}]`;

  // 2. Official Antigravity Quotas (5h and Weekly)
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

  const l2Parts = [segContext, seg5h, segWeek];
  const line2 = `${GRAY}└─ ${RESET}${l2Parts.join(`${GRAY} │ ${RESET}`)}`;

  return `${line1}\n${line2}`;
}

// Execution Entrypoint
try {
  const input = fs.readFileSync(0, 'utf-8');
  if (!input || !input.trim()) {
    process.stdout.write(`┌─ [Antigravity CLI]\n└─ Ctx: 0% [░░░░░░░░] │ 5h: 0% [░░░░░░░░] │ Wk: 0% [░░░░░░░░]`);
    process.exit(0);
  }

  const payload = JSON.parse(input);
  const output = render(payload);
  process.stdout.write(output);
} catch (err) {
  process.stdout.write(`┌─ [Antigravity CLI] (init)\n└─ Ctx: [░░░░░░░░] │ 5h: [░░░░░░░░] │ Wk: [░░░░░░░░]`);
}
