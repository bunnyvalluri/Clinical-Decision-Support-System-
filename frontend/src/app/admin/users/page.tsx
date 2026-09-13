"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Plus, Search, ChevronRight, User, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import {
  ResponsivePageContainer,
  ResponsiveToolbar,
  ResponsiveTable,
  ResponsiveTableColumn,
} from "@/components/responsive";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string;
}

const DEMO_USERS: UserItem[] = [
  { id: "u1", name: "Dr. Elena Vance, MD", email: "dr.elena.vance@hospital.org", role: "DOCTOR", status: "ACTIVE", department: "Cardiology" },
  { id: "u2", name: "Sarah Jenkins, RN", email: "s.jenkins@hospital.org", role: "NURSE", status: "ACTIVE", department: "Emergency Triage" },
  { id: "u3", name: "Alex Rivera, MSc", email: "alex.rivera@hospital.org", role: "MEDICAL_INFORMATICIST", status: "ACTIVE", department: "Clinical Informatics" },
  { id: "u4", name: "Marcus Chen", email: "m.chen@hospital.org", role: "IT_ADMIN", status: "ACTIVE", department: "IT Systems" },
  { id: "u5", name: "Dr. James Park, MD", email: "j.park@hospital.org", role: "DOCTOR", status: "INACTIVE", department: "Pulmonology" },
];

const ROLE_COLORS: Record<string, string> = {
  DOCTOR: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NURSE: "bg-sky-50 text-sky-700 border-sky-200",
  MEDICAL_INFORMATICIST: "bg-purple-50 text-purple-700 border-purple-200",
  IT_ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");

  const filtered = DEMO_USERS.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const columns: ResponsiveTableColumn<UserItem>[] = [
    {
      key: "user",
      header: "Staff Member",
      priority: "high",
      sticky: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs sm:text-sm">{u.name}</p>
            <p className="text-[11px] text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "System Role",
      priority: "high",
      render: (u) => (
        <Badge className={`border text-xs ${ROLE_COLORS[u.role] || "bg-slate-50 border-slate-200"}`}>
          {u.role.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "department",
      header: "Department",
      priority: "medium",
      render: (u) => <span className="text-xs text-slate-600 font-medium">{u.department}</span>,
    },
    {
      key: "status",
      header: "Status",
      priority: "high",
      render: (u) => (
        <Badge className={`border text-xs ${u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
          {u.status}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "Action",
      priority: "high",
      className: "text-right",
      render: (u) => (
        <Link href={`/admin/users/${u.id}`}>
          <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 hover:border-purple-300 text-purple-700 hover:bg-purple-50 gap-1 touch-target">
            <span>Manage</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <ResponsivePageContainer
      title="User Management"
      subtitle={`${DEMO_USERS.length} registered clinical and IT system accounts`}
      actions={
        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 touch-target text-xs sm:text-sm shadow-sm">
          <Plus className="h-4 w-4" />
          <span>Add Staff Account</span>
        </Button>
      }
    >
      <ResponsiveToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search accounts by name, email, or department…"
        filters={
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: "All Roles", value: "ALL" },
              { label: "Doctor", value: "DOCTOR" },
              { label: "Nurse", value: "NURSE" },
              { label: "Medical Informaticist", value: "MEDICAL_INFORMATICIST" },
              { label: "IT Admin", value: "IT_ADMIN" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRoleFilter(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  roleFilter === opt.value
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-purple-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      <ResponsiveTable
        data={filtered}
        columns={columns}
        keyExtractor={(u) => u.id}
        mobileCardRender={(u) => (
          <Link key={u.id} href={`/admin/users/${u.id}`} className="block">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-purple-300 transition-all flex items-center justify-between gap-3 active:scale-[0.99]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm truncate">{u.name}</p>
                    <Badge className={`border text-[10px] px-1.5 py-0 ${ROLE_COLORS[u.role] || "bg-slate-50 border-slate-200"}`}>
                      {u.role.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {u.email} · {u.department}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </Link>
        )}
      />
    </ResponsivePageContainer>
  );
}
