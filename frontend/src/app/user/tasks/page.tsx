"use client";

import * as React from "react";
import Link from "next/link";
import { ListTodo, CheckCircle2, Clock, Calendar, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const INITIAL_TASKS = [
  {
    id: "task-01",
    title: "Log Morning Resting Blood Pressure & Pulse",
    description: "Measure resting blood pressure after 5 minutes of seated rest before breakfast.",
    type: "LOG_VITALS",
    due_date: "Today, 10:00 AM",
    status: "PENDING",
  },
  {
    id: "task-02",
    title: "Morning Antihypertensive Dose (Lisinopril 10mg)",
    description: "Confirm daily scheduled oral dose taken with water.",
    type: "MEDICATION_CONFIRM",
    due_date: "Today, 09:00 AM",
    status: "COMPLETED",
  },
  {
    id: "task-03",
    title: "Pre-Visit Cardiovascular Symptom Survey",
    description: "Fill out the 5-question pre-appointment activity questionnaire.",
    type: "QUESTIONNAIRE",
    due_date: "Tomorrow, 05:00 PM",
    status: "PENDING",
  },
];

export default function PatientTasksPage() {
  const [tasks, setTasks] = React.useState(INITIAL_TASKS);
  const [filter, setFilter] = React.useState("ALL");

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "COMPLETED" ? "PENDING" : "COMPLETED" }
          : t
      )
    );
  };

  const filtered = tasks.filter((t) => filter === "ALL" || t.status === filter);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-teal-600" />
            Daily Health Tasks &amp; Regimen Checklist
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalized health reminders and care milestones assigned by your clinical team.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {["ALL", "PENDING", "COMPLETED"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filter === cat ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((task) => {
          const isDone = task.status === "COMPLETED";
          return (
            <Card
              key={task.id}
              className={`bg-white border-slate-200 shadow-sm transition-all ${
                isDone ? "opacity-75 bg-slate-50/50" : "hover:border-teal-300"
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleTask(task.id)}
                  className="mt-1 h-4 w-4 rounded text-teal-600 focus:ring-teal-600 cursor-pointer"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm font-bold ${
                        isDone ? "line-through text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold border-slate-200 ${
                        isDone ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                      }`}
                    >
                      {task.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{task.description}</p>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" /> Due: {task.due_date}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
