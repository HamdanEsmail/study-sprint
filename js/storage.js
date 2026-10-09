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

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(emptyState);
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return structuredClone(emptyState);
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks.filter(isTask) : [];
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.filter(
          (session) =>
            session &&
            typeof session.id === "string" &&
            typeof session.title === "string" &&
            typeof session.endedAt === "number"
        )
      : [];
    return {
      version: 1,
      tasks,
      timer: isTimer(parsed.timer) ? parsed.timer : null,
      sessions,
    };
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
