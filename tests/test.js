const assert = require('assert');
const { render, makeBar, formatTokens, formatResetDuration } = require('../bin/hud.js');

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

// 3. Test progress bar bounds
const bar0 = stripAnsi(makeBar(0, 8));
const bar50 = stripAnsi(makeBar(50, 8));
const bar100 = stripAnsi(makeBar(100, 8));
assert.strictEqual(bar0, '░░░░░░░░');
assert.strictEqual(bar50, '████░░░░');
assert.strictEqual(bar100, '████████');
console.log('✔ makeBar passed');

// 4. Test render with standard payload
const samplePayload = {
  terminal_width: 120,
  model: { display_name: 'Gemini 3.8 Flash (High)' },
  cycle_mode: 'auto',
  agent_state: 'idle',
  cwd: '/home/user/project',
  vcs: { branch: 'main' },
  subagents: { a1: {} },
  context_window: { current: 45200, limit: 1048576, percentage: 4.31 },
  quota: {
    'gemini-5h': { remaining_fraction: 0.82, reset_in_seconds: 11400 },
    'gemini-weekly': { remaining_fraction: 0.66, reset_in_seconds: 392000 }
  }
};

const output = stripAnsi(render(samplePayload));
assert(output.includes('Gemini 3.8 Flash (High)'));
assert(output.includes('[AUTO]'));
assert(output.includes('project'));
assert(output.includes('main'));
assert(output.includes('1 subagent'));
assert(output.includes('Ctx: 45.2k/1.0M (4.3%)'));
assert(output.includes('5h: 18%'));
assert(output.includes('Wk: 34%'));
console.log('✔ render standard payload passed');

// 5. Test render with empty payload / fallback
const emptyOutput = stripAnsi(render({})).replace(/\s+/g, ' ');
assert(emptyOutput.includes('Gemini'));
assert(emptyOutput.includes('Ctx: 0/1.0M (0.0%)'));
console.log('✔ render fallback passed');

console.log('\nAll tests passed successfully! 🚀');
