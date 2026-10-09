export function createTask(title, subject = "") {
  const trimmed = title.trim();
  const label = subject.trim();
  if (!trimmed) return null;
  return {
    id: crypto.randomUUID(),
    title: trimmed.slice(0, 80),
    subject: label.slice(0, 24),
    completed: false,
    createdAt: Date.now(),
  };
}

export function toggleTask(tasks, id) {
  return tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
}

export function removeTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function selectedTask(tasks, id) {
  return tasks.find((task) => task.id === id) ?? null;
}
