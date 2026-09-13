"use client";

import { ListTodo, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

const DEMO_TASKS = [
  { id: 1, task: "Record vitals for Room 4B", done: false, priority: "HIGH", due: "10:00" },
  { id: 2, task: "Assist with ECG for Patient MRN-3847", done: false, priority: "HIGH", due: "10:30" },
  { id: 3, task: "Update medication chart for James Wilson", done: true, priority: "MEDIUM", due: "09:00" },
  { id: 4, task: "Reassessment of Maria Santos post-medication", done: false, priority: "MEDIUM", due: "11:00" },
  { id: 5, task: "Hand-off report preparation", done: false, priority: "LOW", due: "14:00" },
];

export default function NurseTasksPage() {
  const [tasks, setTasks] = React.useState(DEMO_TASKS);
  const toggle = (id: number) => setTasks((t) => t.map((task) => task.id === id ? { ...task, done: !task.done } : task));

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className={`bg-white border rounded-xl p-4 flex items-center gap-4 transition-all ${t.done ? "border-slate-100 opacity-60" : "border-slate-200"}`}>
            <button onClick={() => toggle(t.id)} className="shrink-0">
              {t.done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-slate-300 hover:text-sky-500 transition-colors" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${t.done ? "line-through text-slate-400" : "text-slate-800"}`}>{t.task}</p>
              <p className="text-xs text-slate-400 mt-0.5">Due {t.due}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              t.priority === "HIGH" ? "bg-rose-50 text-rose-600"
              : t.priority === "MEDIUM" ? "bg-amber-50 text-amber-600"
              : "bg-slate-100 text-slate-500"}`}>
              {t.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
