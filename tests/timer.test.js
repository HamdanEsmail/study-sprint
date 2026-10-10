import assert from "node:assert/strict";
import {
  BREAK_MS,
  FOCUS_MS,
  createTimer,
  formatClock,
  normalizeSettings,
  pause,
  remainingMs,
  reset,
  setMode,
  settle,
  start,
} from "../js/timer.js";

const t0 = 1_000_000;

const idle = createTimer();
assert.equal(idle.durationMs, FOCUS_MS);
assert.equal(remainingMs(idle, t0), FOCUS_MS);
assert.equal(formatClock(FOCUS_MS), "25:00");
assert.equal(formatClock(5 * 60 * 1000), "05:00");
assert.equal(formatClock(1500), "00:02");

const running = start(idle, t0);
assert.equal(running.running, true);
assert.equal(running.endAt, t0 + FOCUS_MS);
assert.equal(remainingMs(running, t0 + 10_000), FOCUS_MS - 10_000);
assert.equal(start(running, t0 + 1).endAt, running.endAt);

const paused = pause(running, t0 + 40_000);
assert.equal(paused.running, false);
assert.equal(paused.remainingMs, FOCUS_MS - 40_000);
assert.equal(remainingMs(paused, t0 + 80_000), FOCUS_MS - 40_000);

const resumed = start(paused, t0 + 80_000);
assert.equal(remainingMs(resumed, t0 + 90_000), FOCUS_MS - 50_000);

const expired = settle(resumed, resumed.endAt + 5);
assert.equal(expired.justCompleted, true);
assert.equal(expired.timer.running, false);
assert.equal(expired.timer.completed, true);
assert.equal(settle(expired.timer, resumed.endAt + 50).justCompleted, false);

const restarted = start(expired.timer, t0);
assert.equal(restarted.completed, false);
assert.equal(remainingMs(restarted, t0), FOCUS_MS);

assert.equal(setMode(idle, "break").durationMs, BREAK_MS);
assert.equal(reset(running).running, false);
assert.equal(reset(running).remainingMs, FOCUS_MS);

const customSettings = {
  focusMs: 15 * 60_000,
  breakMs: 3 * 60_000,
};
const custom = createTimer({ settings: customSettings, taskId: "task-1" });
assert.equal(formatClock(custom.durationMs), "15:00");
const customRunning = start(custom, t0);
const customReset = reset(customRunning, customSettings);
assert.equal(customReset.running, false);
assert.equal(formatClock(customReset.remainingMs), "15:00");
assert.equal(customReset.taskId, "task-1");

const customBreak = setMode(custom, "break", false, customSettings);
assert.equal(formatClock(customBreak.durationMs), "03:00");
assert.equal(customBreak.taskId, "task-1");

assert.deepEqual(normalizeSettings(), {
  focusMs: FOCUS_MS,
  breakMs: BREAK_MS,
});
assert.deepEqual(normalizeSettings(null), {
  focusMs: FOCUS_MS,
  breakMs: BREAK_MS,
});

assert.deepEqual(
  normalizeSettings({ focusMs: 0, breakMs: 200 * 60_000 }),
  { focusMs: 60_000, breakMs: 90 * 60_000 }
);

assert.equal(normalizeSettings({ focusMs: NaN }).focusMs, FOCUS_MS);

const customDemo = createTimer({ demo: true, settings: customSettings });
assert.equal(customDemo.durationMs, 12_000);
assert.equal(reset(customDemo).durationMs, 12_000);

assert.equal(
  setMode(customDemo, "break", true, customSettings).durationMs,
  12_000
);

console.log("timer tests passed");
