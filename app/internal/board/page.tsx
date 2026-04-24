"use client";

import { useCallback, useEffect, useState } from "react";
import type { TeamTask, TaskLane, TaskPriority, AccessLevel } from "@/lib/internal/types";
import { accessLevelFor } from "@/lib/internal/types";
import { createClient } from "@/lib/supabase/client";

const BODY: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
};
const HEADING: React.CSSProperties = {
  fontFamily: "var(--font-playfair), 'Playfair Display', serif",
};

const LANES: Array<{ key: TaskLane; label: string; color: string }> = [
  { key: "build", label: "Build", color: "var(--primary)" },
  { key: "samira", label: "Samira", color: "var(--accent)" },
  { key: "michael", label: "Michael", color: "#E8A464" },
  { key: "blocked", label: "Blocked", color: "var(--muted)" },
];

function dotColor(p: TaskPriority): string {
  return p === "high" ? "var(--accent)" : p === "medium" ? "#E8A464" : "var(--primary)";
}

function canEditLane(level: AccessLevel, lane: TaskLane): boolean {
  if (level === "full") return true;
  return lane === "michael";
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}

export default function BoardPage() {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<AccessLevel>("growth");
  const [addingLane, setAddingLane] = useState<TaskLane | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setLevel(accessLevelFor(data.user?.email) ?? "growth");
    });
    loadTasks();
  }, [supabase]);

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await fetch("/api/internal/tasks", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setTasks(json.tasks ?? []);
      }
    } catch {
      // Leave tasks empty on load failure; UI shows empty lanes.
    } finally {
      setLoading(false);
    }
  }

  const moveTask = useCallback(
    async (id: string, newLane: TaskLane) => {
      const before = tasks;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, lane: newLane } : t)));
      const res = await fetch(`/api/internal/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lane: newLane }),
      });
      if (!res.ok) setTasks(before);
    },
    [tasks]
  );

  async function markDone(id: string) {
    const before = tasks;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "done", completed_at: new Date().toISOString() } : t
      )
    );
    const res = await fetch(`/api/internal/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "done" }),
    });
    if (!res.ok) setTasks(before);
  }

  async function addTask(form: {
    title: string;
    description: string;
    priority: TaskPriority;
    category: string;
    due_date: string;
    lane: TaskLane;
  }) {
    const res = await fetch("/api/internal/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        category: form.category || null,
        due_date: form.due_date || null,
        lane: form.lane,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setTasks((prev) => [json.task, ...prev]);
      setAddingLane(null);
    }
  }

  function onDragStart(ev: React.DragEvent, id: string) {
    ev.dataTransfer.setData("text/task-id", id);
    ev.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(ev: React.DragEvent) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  }

  async function onDrop(ev: React.DragEvent, lane: TaskLane) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text/task-id");
    if (!id) return;
    if (!canEditLane(level, lane)) return;
    const current = tasks.find((t) => t.id === id);
    if (!current) return;
    if (!canEditLane(level, current.lane)) return;
    if (current.lane === lane) return;
    await moveTask(id, lane);
  }

  return (
    <div style={BODY} data-testid="board-root">
      <h1 style={{ ...HEADING, fontSize: 30, color: "var(--primary)", fontWeight: 700, marginBottom: 6 }}>
        Sprint Board
      </h1>
      <p style={{ ...BODY, fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
        Drag cards between lanes. Mark items done as you complete them.
      </p>

      {loading ? (
        <p style={{ ...BODY, fontSize: 14, color: "var(--muted)" }}>Loading tasks...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: 16 }}>
          {LANES.map((lane) => {
            const laneTasks = tasks.filter((t) => t.lane === lane.key);
            const editable = canEditLane(level, lane.key);
            return (
              <section
                key={lane.key}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, lane.key)}
                data-lane={lane.key}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  borderTop: `4px solid ${lane.color}`,
                  padding: 16,
                  minHeight: 200,
                }}
              >
                <div
                  className="flex items-center"
                  style={{ gap: 8, marginBottom: 12 }}
                >
                  <div style={{ ...BODY, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
                    {lane.label}
                  </div>
                  <span
                    style={{
                      ...BODY,
                      fontSize: 12,
                      color: "var(--muted)",
                      backgroundColor: "var(--pale-sage)",
                      padding: "2px 8px",
                      borderRadius: 10,
                    }}
                  >
                    {laneTasks.length}
                  </span>
                </div>

                <div className="flex flex-col" style={{ gap: 10 }}>
                  {laneTasks.map((t) => {
                    const done = t.status === "done";
                    return (
                      <div
                        key={t.id}
                        draggable={editable && !done}
                        onDragStart={(e) => onDragStart(e, t.id)}
                        data-task-id={t.id}
                        data-priority={t.priority}
                        data-done={done ? "true" : "false"}
                        style={{
                          backgroundColor: done ? "var(--pale-sage)" : "var(--white)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: 12,
                          opacity: done ? 0.6 : 1,
                          cursor: editable && !done ? "grab" : "default",
                          textDecoration: done ? "line-through" : "none",
                        }}
                      >
                        <div
                          className="flex items-start"
                          style={{ gap: 8 }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ ...BODY, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                              {t.title}
                            </div>
                            {t.description && (
                              <div
                                style={{
                                  ...BODY,
                                  fontSize: 13,
                                  color: "var(--muted)",
                                  marginTop: 4,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {t.description}
                              </div>
                            )}
                          </div>
                          <span
                            aria-hidden="true"
                            style={{
                              display: "inline-block",
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: dotColor(t.priority),
                              marginTop: 4,
                              flexShrink: 0,
                            }}
                          />
                        </div>
                        <div
                          className="flex items-center flex-wrap"
                          style={{ gap: 8, marginTop: 8 }}
                        >
                          {t.category && (
                            <span
                              style={{
                                ...BODY,
                                fontSize: 11,
                                fontWeight: 500,
                                color: "var(--primary)",
                                backgroundColor: "var(--pale-sage)",
                                padding: "2px 8px",
                                borderRadius: 10,
                              }}
                            >
                              {t.category}
                            </span>
                          )}
                          {t.due_date && (
                            <span style={{ ...BODY, fontSize: 11, color: "var(--muted)" }}>
                              Due {t.due_date}
                            </span>
                          )}
                          {t.assigned_to && (
                            <span
                              className="inline-flex items-center justify-center"
                              style={{
                                ...BODY,
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                backgroundColor: "var(--pale-terra)",
                                fontSize: 10,
                                fontWeight: 600,
                                color: "var(--accent)",
                                marginLeft: "auto",
                              }}
                              title={t.assigned_to}
                            >
                              {initials(t.assigned_to)}
                            </span>
                          )}
                        </div>
                        {editable && !done && (
                          <button
                            type="button"
                            onClick={() => markDone(t.id)}
                            aria-label={`Mark ${t.title} as done`}
                            data-action="mark-done"
                            style={{
                              ...BODY,
                              marginTop: 10,
                              background: "transparent",
                              border: "1px solid var(--border)",
                              color: "var(--primary)",
                              fontSize: 12,
                              padding: "4px 10px",
                              borderRadius: 8,
                              cursor: "pointer",
                            }}
                          >
                            Mark done
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {editable && (
                  <div style={{ marginTop: 12 }}>
                    {addingLane === lane.key ? (
                      <AddTaskForm
                        lane={lane.key}
                        onSubmit={addTask}
                        onCancel={() => setAddingLane(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingLane(lane.key)}
                        style={{
                          ...BODY,
                          width: "100%",
                          background: "transparent",
                          border: "1px dashed var(--border)",
                          color: "var(--muted)",
                          fontSize: 13,
                          padding: "10px",
                          borderRadius: 10,
                          cursor: "pointer",
                        }}
                      >
                        + Add task
                      </button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddTaskForm({
  lane,
  onSubmit,
  onCancel,
}: {
  lane: TaskLane;
  onSubmit: (f: {
    title: string;
    description: string;
    priority: TaskPriority;
    category: string;
    due_date: string;
    lane: TaskLane;
  }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState("");
  const [due, setDue] = useState("");

  const inputStyle: React.CSSProperties = {
    ...BODY,
    width: "100%",
    padding: "8px 10px",
    fontSize: 13,
    border: "1px solid var(--border)",
    borderRadius: 8,
    backgroundColor: "var(--white)",
    color: "var(--text)",
    outline: "none",
    marginBottom: 6,
  };

  return (
    <div
      style={{
        backgroundColor: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 10,
      }}
    >
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <div className="flex" style={{ gap: 6 }}>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
        />
      </div>
      <input
        placeholder="Category (e.g. development)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ ...inputStyle, marginTop: 6, marginBottom: 0 }}
      />
      <div className="flex items-center" style={{ gap: 6, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => {
            if (title.trim()) {
              onSubmit({
                title: title.trim(),
                description,
                priority,
                category,
                due_date: due,
                lane,
              });
            }
          }}
          style={{
            ...BODY,
            flex: 1,
            height: 36,
            borderRadius: 8,
            backgroundColor: "var(--primary)",
            color: "var(--white)",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            ...BODY,
            height: 36,
            padding: "0 12px",
            borderRadius: 8,
            backgroundColor: "transparent",
            color: "var(--muted)",
            fontSize: 13,
            border: "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
