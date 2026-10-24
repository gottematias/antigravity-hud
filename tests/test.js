const assert = require('assert');
const {
  render,
  makeBar,
  formatTokens,
  formatResetDuration,
  formatElapsedDuration,
  resolveModelAndReasoning,
  resolveAccount,
  resolveSessionTiming
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

// Line 2 assertions (column-padded)
assert(output.includes('1 subagent'));
assert(/In:\s+38\.2k/.test(output));
assert(/Out:\s+7\.1k/.test(output));
assert(/Cache:\s+14\.5k\s+\(\s*38%\)/.test(output));

// Line 3 assertions (column-padded)
assert(/Ctx:\s+45\.2k\/\s*1\.0M\s+\(\s*4\.3%\)/.test(output));
assert(/5h:\s+18%/.test(output));
assert(/Wk:\s+34%/.test(output));
assert(lines[2].includes('\x1b[36mCtx:\x1b[0m'));
assert(lines[2].includes('\x1b[36m5h:\x1b[0m'));
assert(lines[2].includes('\x1b[36mWk:\x1b[0m'));

// Box connectors
assert(lines[0].startsWith('\x1b[90m┌─ '));
assert(lines[1].startsWith('\x1b[90m├─ '));
assert(lines[2].startsWith('\x1b[90m└─ '));

console.log('✔ render 3-line standard payload passed');

// 5b. Test render with the payload shape Antigravity CLI actually sends (captured from v1.4.5)
const realPayload = {
  version: '1.4.5',
  email: 'user@example.com',
  terminal_width: 187,
  model: { id: 'Gemini 3.8 Flash (Medium)', display_name: 'Gemini 3.8 Flash (Medium)', effort: 'medium' },
  agent_state: 'working',
  context_window: {
    total_input_tokens: 79509,
    total_output_tokens: 6988,
    context_window_size: 1048576,
    used_percentage: 7.582569122314453,
    remaining_percentage: 92.41743087768555,
    current_usage: {
      input_tokens: 2635,
      output_tokens: 112,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 64355
    }
  },
  quota: {
    'gemini-5h': { remaining_fraction: 0.5725157, reset_in_seconds: 5386 },
    'gemini-weekly': { remaining_fraction: 0.5010628, reset_in_seconds: 173564 }
  }
};

const realOutput = stripAnsi(render(realPayload));
assert(/In:\s+79\.5k/.test(realOutput), 'In must come from context_window.total_input_tokens');
assert(/Out:\s+7\.0k/.test(realOutput), 'Out must come from context_window.total_output_tokens');
// 64355 / (2635 input + 0 creation + 64355 read) = 96% hit rate for the last turn
assert(/Cache:\s+64\.4k\s+\(\s*96%\)/.test(realOutput), 'Cache must use current_usage.cache_read_input_tokens over the same turn prompt');
assert(/Ctx:\s+79\.5k\/\s*1\.0M\s+\(\s*7\.6%\)/.test(realOutput), 'Ctx must come from total_input_tokens / context_window_size / used_percentage');
assert(/5h:\s+43%/.test(realOutput));
assert(/Wk:\s+50%/.test(realOutput));

// Context window refreshes: a later payload with grown totals must render the new values
const grown = JSON.parse(JSON.stringify(realPayload));
grown.context_window.total_input_tokens = 120000;
grown.context_window.used_percentage = 11.44;
assert(/Ctx:\s+120\.0k\/\s*1\.0M\s+\(\s*11\.4%\)/.test(stripAnsi(render(grown))), 'Ctx must refresh with new payload values');

// used_percentage absent: percentage is derived from total_input_tokens / context_window_size
const noPct = JSON.parse(JSON.stringify(realPayload));
delete noPct.context_window.used_percentage;
assert(/Ctx:\s+79\.5k\/\s*1\.0M\s+\(\s*7\.6%\)/.test(stripAnsi(render(noPct))), 'Ctx percentage must be derived when used_percentage is missing');

// Explicit nulls in context_window fall through to the legacy flat fields instead of rendering 0
const nullTotals = {
  context_window: { total_input_tokens: null, total_output_tokens: null, context_window_size: null, used_percentage: null },
  tokens: { input: 1000, output: 200, cached: 500 }
};
const nullOutput = stripAnsi(render(nullTotals));
assert(/In:\s+1\.0k/.test(nullOutput), 'null total_input_tokens must fall back to tokens.input');
assert(/Out:\s+200/.test(nullOutput), 'null total_output_tokens must fall back to tokens.output');
assert(/Cache:\s+500\s+\(\s*50%\)/.test(nullOutput), 'legacy cache hit rate must still use input tokens as base');

// Payload carrying both shapes: context_window wins
const mixed = JSON.parse(JSON.stringify(realPayload));
mixed.tokens = { input: 1, output: 2, cached: 3 };
const mixedOutput = stripAnsi(render(mixed));
assert(/In:\s+79\.5k/.test(mixedOutput) && /Out:\s+7\.0k/.test(mixedOutput), 'context_window must take precedence over flat tokens');

// current_usage without cache fields: no cache segment value, no crash
const noCache = JSON.parse(JSON.stringify(realPayload));
noCache.context_window.current_usage = { input_tokens: 100, output_tokens: 5 };
assert(/Cache:\s+0/.test(stripAnsi(render(noCache))), 'missing cache_read_input_tokens must render Cache: 0');

console.log('✔ render real Antigravity payload passed');

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
assert(emptyOutput.includes('Ctx: 0/ 1.0M ( 0.0%)'));
console.log('✔ render fallback passed');

// 8. Test column alignment invariance across variable payloads
const pA = render(samplePayload);
const pB = render({ terminal_width: 120, user: { email: 'test@example.com' } });
const pC = render({ terminal_width: 120, tokens: { input: 0, output: 0 }, context_window: { current: 0, limit: 1048576, percentage: 0 } });

const linesA = stripAnsi(pA).split('\n');
const linesB = stripAnsi(pB).split('\n');
const linesC = stripAnsi(pC).split('\n');

// Line 2: separator pipe and Cache positions must be identical
assert.strictEqual(linesA[1].indexOf('│'), linesB[1].indexOf('│'), 'Line 2 pipe column must be invariant');
assert.strictEqual(linesA[1].indexOf('│'), linesC[1].indexOf('│'), 'Line 2 pipe column must be invariant');
assert.strictEqual(linesA[1].indexOf('⚡'), linesB[1].indexOf('⚡'), 'Line 2 Cache icon column must be invariant');

// Line 3: pipe1 and pipe2 positions must be identical
assert.strictEqual(linesA[2].indexOf('│'), linesB[2].indexOf('│'), 'Line 3 pipe 1 column must be invariant');
assert.strictEqual(linesA[2].indexOf('│'), linesC[2].indexOf('│'), 'Line 3 pipe 1 column must be invariant');
assert.strictEqual(linesA[2].lastIndexOf('│'), linesB[2].lastIndexOf('│'), 'Line 3 pipe 2 column must be invariant');
assert.strictEqual(linesA[2].lastIndexOf('│'), linesC[2].lastIndexOf('│'), 'Line 3 pipe 2 column must be invariant');
assert.strictEqual(linesA[2].indexOf('Wk:'), linesB[2].indexOf('Wk:'), 'Line 3 Wk label column must be invariant');
console.log('✔ column alignment invariance across payloads verified');

// 9. Test elapsed duration formatting
assert.strictEqual(formatElapsedDuration(0), '0s');
assert.strictEqual(formatElapsedDuration(18), '18s');
assert.strictEqual(formatElapsedDuration(59), '59s');
assert.strictEqual(formatElapsedDuration(60), '1m');
assert.strictEqual(formatElapsedDuration(180), '3m');
assert.strictEqual(formatElapsedDuration(5040), '1h 24m');
assert.strictEqual(formatElapsedDuration(86400), '1d 0h');
assert.strictEqual(formatElapsedDuration(90000), '1d 1h');
console.log('✔ formatElapsedDuration passed');

// 10. Test resolveSessionTiming transitions and boundaries
const baseTime = 1700000000000;
const testState = { sessions: {} };

// Step A: First prompt in session (idle at t=0)
const timingA = resolveSessionTiming(
  { session_id: 'test-sess', agent_state: 'idle' },
  { now: baseTime, sessionState: testState, persist: false }
);
assert.strictEqual(timingA.sessionElapsedSec, 0);
assert.strictEqual(timingA.turnElapsedSec, 0);
assert.strictEqual(timingA.idleElapsedSec, 0);
assert.strictEqual(timingA.isActive, false);

// Step B: Agent transitions to executing 20s later
const timingB = resolveSessionTiming(
  { session_id: 'test-sess', agent_state: 'executing' },
  { now: baseTime + 20000, sessionState: testState, persist: false }
);
assert.strictEqual(timingB.sessionElapsedSec, 20);
assert.strictEqual(timingB.turnElapsedSec, 0);
assert.strictEqual(timingB.isActive, true);

// Step C: Agent still executing 18s into the turn (t=38s)
const timingC = resolveSessionTiming(
  { session_id: 'test-sess', agent_state: 'executing' },
  { now: baseTime + 38000, sessionState: testState, persist: false }
);
assert.strictEqual(timingC.sessionElapsedSec, 38);
assert.strictEqual(timingC.turnElapsedSec, 18);
assert.strictEqual(timingC.isActive, true);

// Step D: Agent finishes and goes idle at t=50s
const timingD = resolveSessionTiming(
  { session_id: 'test-sess', agent_state: 'idle' },
  { now: baseTime + 50000, sessionState: testState, persist: false }
);
assert.strictEqual(timingD.sessionElapsedSec, 50);
assert.strictEqual(timingD.turnElapsedSec, 0);
assert.strictEqual(timingD.idleElapsedSec, 0);
assert.strictEqual(timingD.isActive, false);

// Step E: Agent idle 3 minutes later (t=230s, 180s of inactivity)
const timingE = resolveSessionTiming(
  { session_id: 'test-sess', agent_state: 'idle' },
  { now: baseTime + 230000, sessionState: testState, persist: false }
);
assert.strictEqual(timingE.sessionElapsedSec, 230);
assert.strictEqual(timingE.idleElapsedSec, 180);
assert.strictEqual(timingE.isActive, false);

// Step F: New session_id resets timing
const timingF = resolveSessionTiming(
  { session_id: 'new-sess', agent_state: 'idle' },
  { now: baseTime + 300000, sessionState: testState, persist: false }
);
assert.strictEqual(timingF.sessionElapsedSec, 0);
console.log('✔ resolveSessionTiming transitions and boundaries passed');

// 11. Test Line 1 session and activity rendering
const sessionMemory = {
  sessions: {
    'render-sess': {
      sessionStartTime: baseTime,
      lastActiveTime: baseTime + 5040000 - 180000, // 3 minutes ago
      lastState: 'idle',
      turnStartTime: null,
      totalActiveMs: 600000,
      lastTick: baseTime + 5040000,
      lastTokens: 5000
    }
  }
};

// 11a: IDLE with 3m inactivity renders session time and idle indicator
const idleRender = stripAnsi(render(
  { session_id: 'render-sess', agent_state: 'idle', terminal_width: 120 },
  { now: baseTime + 5040000, sessionState: sessionMemory, persist: false }
));
assert(idleRender.includes('⚡ IDLE ── ⏱️ 1h 24m │ 💤 hace 3m'), 'Line 1 IDLE must show session duration and idle elapsed');

// 11b: EXECUTING with turn in progress renders turn duration
sessionMemory.sessions['render-sess'].lastState = 'executing';
sessionMemory.sessions['render-sess'].turnStartTime = baseTime + 5040000 - 18000; // 18s ago
const execRender = stripAnsi(render(
  { session_id: 'render-sess', agent_state: 'executing', terminal_width: 120 },
  { now: baseTime + 5040000, sessionState: sessionMemory, persist: false }
));
assert(execRender.includes('⚙ EXECUTING (18s) ── ⏱️ 1h 24m'), 'Line 1 EXECUTING must show turn duration and session duration');

// 11c: Narrow terminal omits idle suffix to prevent overflow
const narrowRender = stripAnsi(render(
  { session_id: 'render-sess', agent_state: 'idle', terminal_width: 80 },
  { now: baseTime + 5040000, sessionState: sessionMemory, persist: false }
));
assert(narrowRender.includes('⏱️ 1h 24m'), 'Narrow mode must retain session duration');
assert(!narrowRender.includes('💤 hace'), 'Narrow mode must omit idle detail to avoid line wrap');
console.log('✔ Line 1 session and activity rendering passed');

console.log('\nAll tests passed successfully! 🚀');
