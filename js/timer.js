export const FOCUS_MS = 25 * 60 * 1000;
export const BREAK_MS = 5 * 60 * 1000;
export const DEMO_MS = 12 * 1000;

export function normalizeSettings(settings = {}) {
  const source = settings && typeof settings === "object" ? settings : {};

  function normalizeDuration(value, fallback) {
    if (!Number.isFinite(value)) return fallback;
    const minutes = Math.round(value / 60_000);
    return Math.min(90, Math.max(1, minutes)) * 60_000;
  }

  return {
    focusMs: normalizeDuration(source.focusMs, FOCUS_MS),
    breakMs: normalizeDuration(source.breakMs, BREAK_MS),
  };
}

export function durationFor(mode, demo = false, settings = {}) {
  if (demo) return DEMO_MS;
  const durations = normalizeSettings(settings);
  return mode === "break" ? durations.breakMs : durations.focusMs;
}
export function createTimer({
  mode = "focus",
  demo = false,
  taskId = null,
  settings = {},
  } = {}) {
    const durationMs = durationFor(mode, demo, settings);
    return {
      mode,
      demo,
      durationMs,
      remainingMs: durationMs,
      endAt: null,
      running: false,
      completed: false,
      taskId,
    };
  }
export function remainingMs(timer, now) {
  if (!timer.running) return Math.max(0, Number(timer.remainingMs) || 0);
  return Math.max(0, Number(timer.endAt) - now);
}

export function start(timer, now) {
  if (timer.running) return timer;
  const leftover = remainingMs({ ...timer, running: false }, now);
  const remaining = leftover > 0 ? leftover : timer.durationMs;
  return {
    ...timer,
    running: true,
    remainingMs: remaining,
    endAt: now + remaining,
    completed: false,
  };
}

export function pause(timer, now) {
  if (!timer.running) return timer;
  return {
    ...timer,
    running: false,
    remainingMs: remainingMs(timer, now),
    endAt: null,
  };
}

export function reset(timer, settings = {}) {
  return createTimer({
    mode: timer.mode,
    demo: timer.demo,
    taskId: timer.taskId,
    settings,
  });
}
export function setMode(timer, mode, demo, settings = {}) {
  return createTimer({
    mode,
    demo: demo ?? timer.demo,
    taskId: timer.taskId,
    settings,
  });
}

export function setTask(timer, taskId) {
  return { ...timer, taskId };
}

export function settle(timer, now) {
  if (!timer.running) {
    return { timer, justCompleted: false };
  }
  if (remainingMs(timer, now) > 0) {
    return { timer, justCompleted: false };
  }
  if (timer.completed) {
    return {
      timer: { ...timer, running: false, remainingMs: 0, endAt: null },
      justCompleted: false,
    };
  }
  return {
    timer: {
      ...timer,
      running: false,
      remainingMs: 0,
      endAt: null,
      completed: true,
    },
    justCompleted: true,
  };
}

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
