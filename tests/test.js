const assert = require('assert');
const {
  render,
  makeBar,
  formatTokens,
  formatResetDuration,
  resolveModelAndReasoning,
  resolveAccount
} = require('../bin/hud.js');

console.log('Running test suite for Antigravity HUD...');

// 1. Test token formatting
assert.strictEqual(formatTokens(0), '0');
assert.strictEqual(formatTokens(950), '950');
assert.strictEqual(formatTokens(45200), '45.2k');
assert.strictEqual(formatTokens(1048576), '1.0M');
console.log('✔ formatTokens passed');

// 2. Test duration formatting
assert.strictEqual(formatResetDuration(0), '');
assert.strictEqual(formatResetDuration(300), '5m');
assert.strictEqual(formatResetDuration(7200), '2h 0m');
assert.strictEqual(formatResetDuration(396000), '4d 14h');
console.log('✔ formatResetDuration passed');

// Helper to strip ANSI escape codes for testing
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// 3. Test progress bar bounds and color thresholds
// Thresholds: <75% -> Green (\x1b[32m), >=75% -> Yellow (\x1b[33m), >=90% -> Red (\x1b[31m)
const rawBar50 = makeBar(50, 8);
const rawBar74 = makeBar(74, 8);
const rawBar75 = makeBar(75, 8);
const rawBar89 = makeBar(89, 8);
const rawBar90 = makeBar(90, 8);

assert(rawBar50.startsWith('\x1b[32m'), '50% must be GREEN');
assert(rawBar74.startsWith('\x1b[32m'), '74% must be GREEN');
assert(rawBar75.startsWith('\x1b[33m'), '75% must be YELLOW');
assert(rawBar89.startsWith('\x1b[33m'), '89% must be YELLOW');
assert(rawBar90.startsWith('\x1b[31m'), '90% must be RED');

const bar0 = stripAnsi(makeBar(0, 8));
const bar50 = stripAnsi(rawBar50);
const bar100 = stripAnsi(makeBar(100, 8));
assert.strictEqual(bar0, '░░░░░░░░');
assert.strictEqual(bar50, '████░░░░');
assert.strictEqual(bar100, '████████');
console.log('✔ makeBar color thresholds (<75% green, >=75% yellow, >=90% red) and bounds passed');

// 4. Test model and reasoning resolution
assert.strictEqual(
  resolveModelAndReasoning({ model: { display_name: 'Gemini 3.8 Flash (Medium)' } }),
  'Gemini 3.8 Flash · 🧠 Medium'
);
assert.strictEqual(
  resolveModelAndReasoning({ model: { display_name: 'Gemini 3.8 Flash (High)' } }),
  'Gemini 3.8 Flash · 🧠 High'
);
assert.strictEqual(
  resolveModelAndReasoning({ model: { id: 'gemini-pro' }, reasoning_effort: 'Low' }),
  'gemini-pro · 🧠 Low'
);
console.log('✔ resolveModelAndReasoning passed');

// 5. Test render with standard payload (3 lines layout)
const samplePayload = {
  terminal_width: 120,
  user: { email: 'manigounl92@gmail.com' },
  model: { display_name: 'Gemini 3.8 Flash (Medium)' },
  cycle_mode: 'auto',
  agent_state: 'idle',
  subagents: { a1: {} },
  tokens: { input: 38200, output: 7100, cached: 14500 },
  context_window: { current: 45200, limit: 1048576, percentage: 4.31 },
  quota: {
    'gemini-5h': { remaining_fraction: 0.82, reset_in_seconds: 11400 },
    'gemini-weekly': { remaining_fraction: 0.66, reset_in_seconds: 392000 }
  }
};

const fullOutput = render(samplePayload);
const lines = fullOutput.split('\n');
assert.strictEqual(lines.length, 3, 'Output must have exactly 3 lines');

const output = stripAnsi(fullOutput);
// Line 1 assertions
assert(output.includes('manigounl92@gmail.com'));
assert(output.includes('Gemini 3.8 Flash · 🧠 Medium'));
assert(output.includes('[AUTO]'));
assert(output.includes('IDLE'));

// Line 2 assertions
assert(output.includes('1 subagent'));
assert(output.includes('In: 38.2k'));
assert(output.includes('Out: 7.1k'));
assert(output.includes('Cache: 14.5k (38%)'));

// Line 3 assertions
assert(output.includes('Ctx: 45.2k/1.0M (4.3%)'));
assert(output.includes('5h: 18%'));
assert(output.includes('Wk: 34%'));
assert(lines[2].includes('\x1b[36mCtx:\x1b[0m'));
assert(lines[2].includes('\x1b[36m5h:\x1b[0m'));
assert(lines[2].includes('\x1b[36mWk:\x1b[0m'));

// Box connectors
assert(lines[0].startsWith('\x1b[90m┌─ '));
assert(lines[1].startsWith('\x1b[90m├─ '));
assert(lines[2].startsWith('\x1b[90m└─ '));

console.log('✔ render 3-line standard payload passed');

// 6. Test agent states with custom icons
const testStates = [
  { state: 'idle', expected: '⚡ IDLE' },
  { state: 'thinking', expected: '🧠 THINKING' },
  { state: 'streaming', expected: '✍ STREAMING' },
  { state: 'waiting_confirmation', expected: '✋ CONFIRM' },
  { state: 'executing', expected: '⚙ EXECUTING' },
  { state: 'running', expected: '⚙ RUNNING' },
  { state: 'tool', expected: '🔧 TOOL' },
  { state: 'compacting', expected: '📦 COMPACTING' },
  { state: 'authenticating', expected: '🔑 AUTH' },
  { state: 'error', expected: '❌ ERROR' }
];

for (const { state, expected } of testStates) {
  const rendered = stripAnsi(render({ agent_state: state }));
  assert(rendered.includes(expected), `Expected state "${state}" to render with "${expected}"`);
}
console.log('✔ agent states and icons passed');

// 7. Test render with empty payload / fallback
const emptyOutput = stripAnsi(render({})).replace(/\s+/g, ' ');
assert(emptyOutput.includes('Gemini'));
assert(emptyOutput.includes('0 subagents'));
assert(emptyOutput.includes('Ctx: 0/1.0M (0.0%)'));
console.log('✔ render fallback passed');

console.log('\nAll tests passed successfully! 🚀');
