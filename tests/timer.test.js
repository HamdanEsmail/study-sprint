import assert from "node:assert/strict";
import {
  BREAK_MS,
  FOCUS_MS,
  createTimer,
  formatClock,
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

console.log("timer tests passed");
