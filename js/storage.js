const KEY = "study-sprint.v1";

const emptyState = {
  version: 1,
  tasks: [],
  timer: null,
  sessions: [],
};

function isTask(value) {
  return (
    value &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.completed === "boolean" &&
    typeof value.createdAt === "number"
  );
}

function isTimer(value) {
  return (
    value &&
    (value.mode === "focus" || value.mode === "break") &&
    typeof value.durationMs === "number" &&
    typeof value.remainingMs === "number" &&
    typeof value.running === "boolean"
  );
}
function isSession(value) {
  return (
    value &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.endedAt === "number"
  );
}
function normalizeState(parsed) {
  if (!parsed || parsed.version !== 1) return null;
  if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.sessions)) return null;
  const tasks = parsed.tasks.filter(isTask);
  if (tasks.length !== parsed.tasks.length) return null;
  const sessions = parsed.sessions.filter(isSession);
  if (sessions.length !== parsed.sessions.length) return null;
  if (parsed.timer != null && !isTimer(parsed.timer)) return null;
  return {
    version: 1,
    tasks,
    timer: parsed.timer ?? null,
    sessions,
  };
}
export function parseBackup(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, error: "The file is empty." };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "The file is not valid JSON." };
  }
  const state = normalizeState(parsed);
  if (!state) {
    return { ok: false, error: "That backup is missing tasks or has the wrong shape." };
  }
  return { ok: true, state };
}

export function exportBackup(state) {
  return JSON.stringify(
    {
      version: 1,
      tasks: state.tasks,
      timer: state.timer,
      sessions: state.sessions.slice(-40),
    },
    null,
    2
  );
}
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(emptyState);
    const parsed = JSON.parse(raw);
    return normalizeState(parsed) ?? structuredClone(emptyState);
  } catch {
    return structuredClone(emptyState);
  }
}

export function saveState(state) {
  const payload = {
    version: 1,
    tasks: state.tasks,
    timer: state.timer,
    sessions: state.sessions.slice(-40),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
