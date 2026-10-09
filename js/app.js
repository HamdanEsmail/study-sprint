import { loadState, saveState } from "./storage.js";
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
import { createTask, removeTask, selectedTask, toggleTask } from "./tasks.js";

const demo = new URLSearchParams(location.search).has("demo");
const saved = loadState();

function initialTimer() {
  if (demo) {
    return createTimer({
      mode: saved.timer?.mode === "break" ? "break" : "focus",
      demo: true,
      taskId: saved.timer?.taskId ?? null,
    });
  }
  if (saved.timer) {
    return { ...createTimer({ mode: saved.timer.mode, taskId: saved.timer.taskId }), ...saved.timer, demo: false };
  }
  return createTimer();
}

const state = {
  tasks: saved.tasks,
  timer: initialTimer(),
  sessions: saved.sessions,
  saveError: false,
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
};

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

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "icon-btn";
  remove.setAttribute("aria-label", `Delete ${task.title}`);
  remove.textContent = "Delete";
  remove.addEventListener("click", () => {
    state.tasks = removeTask(state.tasks, task.id);
    if (state.timer.taskId === task.id) state.timer = setTask(state.timer, null);
    persist();
    render();
  });

  item.append(select, complete, remove);
  return item;
}

els.toggle.addEventListener("click", () => {
  const now = Date.now();
  state.timer = state.timer.running ? pause(state.timer, now) : start(state.timer, now);
  els.completeNote.textContent = "";
  persist();
  render(now);
});

els.reset.addEventListener("click", () => {
  state.timer = reset(state.timer);
  els.completeNote.textContent = "";
  persist();
  render();
});

els.modeFocus.addEventListener("change", () => {
  if (!els.modeFocus.checked) return;
  state.timer = setMode(state.timer, "focus", demo);
  els.completeNote.textContent = "";
  persist();
  render();
});

els.modeBreak.addEventListener("change", () => {
  if (!els.modeBreak.checked) return;
  state.timer = setMode(state.timer, "break", demo);
  els.completeNote.textContent = "";
  persist();
  render();
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const task = createTask(els.title.value, els.subject.value);
  if (!task) return;
  state.tasks = [task, ...state.tasks];
  if (!state.timer.taskId) state.timer = setTask(state.timer, task.id);
  els.form.reset();
  els.title.focus();
  persist();
  render();
});

document.addEventListener("keydown", (event) => {
  const typing =
    event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
  if (typing) return;
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

render();
window.setInterval(() => {
  if (state.timer.running) render();
}, 250);
