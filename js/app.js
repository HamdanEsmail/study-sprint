import { exportBackup, loadState, parseBackup, saveState } from "./storage.js";
import {
  createTimer,
  formatClock,
  pause,
  remainingMs,
  reset,
  setMode,
  setTask,
  settle,
  start,
} from "./timer.js";
import { createTask, removeTask, selectedTask, toggleTask, updateTask } from "./tasks.js";

const demo = new URLSearchParams(location.search).has("demo");
const saved = loadState();

function initialTimer(snapshot = saved) {
  const fresh = createTimer({
    mode: snapshot.timer?.mode === "break" ? "break" : "focus",
    demo,
    taskId: snapshot.timer?.taskId ?? null,
    settings: snapshot.settings,
  });
  
  if (demo || !snapshot.timer || snapshot.timer.demo) {
    return fresh;
  }
  return {
    ...fresh,
    ...snapshot.timer,
    demo: false,
  };
}

const state = {
  tasks: saved.tasks,
  timer: initialTimer(),
  sessions: saved.sessions,
  settings: saved.settings,
  saveError: false,
  editingId: null,
};

const els = {
  clock: document.querySelector("#clock"),
  focusTitle: document.querySelector("#focus-title"),
  toggle: document.querySelector("#toggle"),
  reset: document.querySelector("#reset"),
  form: document.querySelector("#add-form"),
  title: document.querySelector("#task-title"),
  subject: document.querySelector("#task-subject"),
  list: document.querySelector("#task-list"),
  sessions: document.querySelector("#session-list"),
  empty: document.querySelector("#empty-queue"),
  saveNote: document.querySelector("#save-note"),
  modeFocus: document.querySelector("#mode-focus"),
  modeBreak: document.querySelector("#mode-break"),
  completeNote: document.querySelector("#complete-note"),
  addButton: document.querySelector("#add-submit"),
  exportBackup: document.querySelector("#export-backup"),
  importBackup: document.querySelector("#import-backup"),
  backupNote: document.querySelector("#backup-note"),
  durationForm: document.querySelector("#duration-form"),
  durationFields: document.querySelector("#duration-fields"),
  focusMinutes: document.querySelector("#focus-minutes"),
  breakMinutes: document.querySelector("#break-minutes"),
  durationNote: document.querySelector("#duration-note"),
};

function syncDurationInputs() {
  els.focusMinutes.value = String(state.settings.focusMs / 60_000);
  els.breakMinutes.value = String(state.settings.breakMs / 60_000);
}

function persist() {
  const result = saveState(state);
  state.saveError = !result.ok;
}

function currentRemaining(now = Date.now()) {
  const settled = settle(state.timer, now);
  if (settled.justCompleted) {
    const task = selectedTask(state.tasks, state.timer.taskId);
    state.sessions = [
      {
        id: crypto.randomUUID(),
        taskId: state.timer.taskId,
        title: task?.title ?? (state.timer.mode === "break" ? "Break" : "Focus"),
        mode: state.timer.mode,
        durationMs: state.timer.durationMs,
        endedAt: now,
      },
      ...state.sessions,
    ].slice(0, 40);
    state.timer = settled.timer;
    persist();
    announceComplete();
  } else {
    state.timer = settled.timer;
  }
  return remainingMs(state.timer, now);
}

function announceComplete() {
  const mode = state.timer.mode === "break" ? "Break finished." : "Focus sprint finished.";
  els.completeNote.textContent =
    state.timer.mode === "focus"
      ? `${mode} Take a short break, or start another sprint.`
      : `${mode} Pick the next task when you are ready.`;
}

function render(now = Date.now()) {
  const remaining = currentRemaining(now);
  const task = selectedTask(state.tasks, state.timer.taskId);
  els.clock.textContent = formatClock(remaining);
  els.focusTitle.textContent = task
    ? task.title
    : state.timer.mode === "break"
      ? "Break"
      : "Choose a task, then start";
  els.toggle.textContent = state.timer.running ? "Pause" : "Start";
  els.toggle.setAttribute("aria-pressed", String(state.timer.running));
  els.modeFocus.checked = state.timer.mode === "focus";
  els.modeBreak.checked = state.timer.mode === "break";
  els.durationFields.disabled = state.timer.running;

  const durationMessage = state.timer.running
  ? "Pause the timer before changing lengths."
  : demo
    ? "Demo sessions stay at 12 seconds. Applying Lengths resets the timer."
    : "Applying lengths resets the current timer.";

  if (els.durationNote.textContent !== durationMessage) {
    els.durationNote.textContent = durationMessage;
  }
  els.saveNote.textContent = state.saveError
    ? "This browser blocked saving. Your queue may disappear after refresh."
    : "Saved in this browser only.";

  const open = state.tasks.filter((taskItem) => !taskItem.completed);
  const done = state.tasks.filter((taskItem) => taskItem.completed);
  els.empty.hidden = state.tasks.length > 0;
  els.list.replaceChildren();

  for (const taskItem of [...open, ...done]) {
    els.list.append(renderTask(taskItem));
  }

  els.sessions.replaceChildren();
  if (state.sessions.length === 0) {
    const item = document.createElement("li");
    item.className = "muted";
    item.textContent = "Finished sprints will appear here.";
    els.sessions.append(item);
  } else {
    for (const session of state.sessions.slice(0, 8)) {
      const item = document.createElement("li");
      const when = new Date(session.endedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      item.textContent = `${session.mode === "break" ? "Break" : "Focus"} · ${session.title} · ${when}`;
      els.sessions.append(item);
    }
  }
}

function renderTask(task) {
  const item = document.createElement("li");
  item.className = "task";
  if (task.id === state.timer.taskId) item.classList.add("is-selected");
  if (task.completed) item.classList.add("is-done");

  const select = document.createElement("button");
  select.type = "button";
  select.className = "task-select";
  select.setAttribute("aria-pressed", String(task.id === state.timer.taskId));
  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;
  select.append(title);
  if (task.subject) {
    const subject = document.createElement("span");
    subject.className = "task-subject";
    subject.textContent = task.subject;
    select.append(subject);
  }
  select.addEventListener("click", () => {
    state.timer = setTask(state.timer, task.id);
    persist();
    render();
  });

  const complete = document.createElement("button");
  complete.type = "button";
  complete.className = "icon-btn";
  complete.setAttribute("aria-label", task.completed ? `Mark ${task.title} as open` : `Complete ${task.title}`);
  complete.textContent = task.completed ? "Undo" : "Done";
  complete.addEventListener("click", () => {
    state.tasks = toggleTask(state.tasks, task.id);
    persist();
    render();
  });

  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "icon-btn";
  edit.setAttribute("aria-label", `Edit ${task.title}`);
  edit.textContent = "Edit";
  edit.addEventListener("click", () => {
    state.editingId = task.id;
    els.title.value = task.title;
    els.subject.value = task.subject ?? "";
    els.addButton.textContent = "Save";
    els.title.focus();
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "icon-btn";
  remove.setAttribute("aria-label", `Delete ${task.title}`);
  remove.textContent = "Delete";
  remove.addEventListener("click", () => {
    state.tasks = removeTask(state.tasks, task.id);
    if (state.timer.taskId === task.id) state.timer = setTask(state.timer, null);
    if (state.editingId === task.id) clearEditing();
    persist();
    render();
  });

  item.append(select, edit, complete, remove);
  return item;
}

els.durationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.timer.running || !els.durationForm.reportValidity()) {
    return;
  }
  state.settings = {
    focusMs: els.focusMinutes.valueAsNumber * 60_000,
    breakMs: els.breakMinutes.valueAsNumber * 60_000,
  };
  state.timer = reset(state.timer, state.settings);
  els.completeNote.textContent = "";
  syncDurationInputs();
  persist();
  render();
});

els.toggle.addEventListener("click", () => {
  const now = Date.now();
  state.timer = state.timer.running ? pause(state.timer, now) : start(state.timer, now);
  els.completeNote.textContent = "";
  persist();
  render(now);
});

els.reset.addEventListener("click", () => {
  state.timer = reset(state.timer, state.settings);
  els.completeNote.textContent = "";
  persist();
  render();
});

els.modeFocus.addEventListener("change", () => {
  if (!els.modeFocus.checked) return;
  state.timer = setMode(state.timer, "focus", demo, state.settings);
  els.completeNote.textContent = "";
  persist();
  render();
});

els.modeBreak.addEventListener("change", () => {
  if (!els.modeBreak.checked) return;
  state.timer = setMode(state.timer, "break", demo, state.settings);
  els.completeNote.textContent = "";
  persist();
  render();
});

function clearEditing() {
  state.editingId = null;
  els.form.reset();
  els.addButton.textContent = "Add";
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.editingId) {
    const next = updateTask(state.tasks, state.editingId, els.title.value, els.subject.value);
    if (!next) return;
    state.tasks = next;
    clearEditing();
    persist();
    render();
    return;
  }
  const task = createTask(els.title.value, els.subject.value);
  if (!task) return;
  state.tasks = [task, ...state.tasks];
  if (!state.timer.taskId) state.timer = setTask(state.timer, task.id);
  els.form.reset();
  els.title.focus();
  persist();
  render();
});
function applyImportedState(next) {
  state.tasks = next.tasks;
  state.sessions = next.sessions;
  state.settings = next.settings;
  state.timer = initialTimer(next);
  clearEditing();
  syncDurationInputs();
  els.completeNote.textContent = "";
}
els.exportBackup.addEventListener("click", () => {
  const blob = new Blob([exportBackup(state)], { type: "application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "study-sprint-backup.json";
  link.click();
  URL.revokeObjectURL(url);
  els.backupNote.textContent = "Backup downloaded.";
});
els.importBackup.addEventListener("change", async () => {
  const file = els.importBackup.files[0];
  els.importBackup.value = "";
  if (!file) return;
  const text = await file.text();
  const result = parseBackup(text);
  if (!result.ok) {
    els.backupNote.textContent = result.error;
    return;
  }
  applyImportedState(result.state);
  persist();
  render();
  els.backupNote.textContent = "Backup restored.";
});
document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const usingControl = 
  event.target instanceof Element && event.target.closest("input, textarea, select, button, a, [contenteditable]");
  if (usingControl) return;
  if (event.code === "Space") {
    event.preventDefault();
    els.toggle.click();
  }
  if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    els.reset.click();
  }
  if (event.key.toLowerCase() === "n") {
    event.preventDefault();
    els.title.focus();
  }
});

document.addEventListener("visibilitychange", () => {
  render();
});

syncDurationInputs();
render();
window.setInterval(() => {
  if (state.timer.running) render();
}, 250);
