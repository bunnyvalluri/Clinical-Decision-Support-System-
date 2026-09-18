"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Lock,
  Mail,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  UserCog,
  Users,
  UserX,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsivePageContainer,
  ResponsiveToolbar,
  ResponsiveTable,
  ResponsiveTableColumn,
} from "@/components/responsive";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "DOCTOR" | "NURSE" | "MEDICAL_INFORMATICIST" | "IT_ADMIN";
  status: "ACTIVE" | "INACTIVE";
  department: string;
  license: string;
  lastLogin: string;
  twoFactorEnabled: boolean;
}

const INITIAL_DEMO_USERS: UserItem[] = [
  { id: "u1", name: "Dr. Vadla Abhinay, MD", email: "dr.abhinay.vadla@hospital.org", role: "DOCTOR", status: "ACTIVE", department: "Cardiology", license: "MD-883921", lastLogin: "Just now", twoFactorEnabled: true },
  { id: "u2", name: "Sarah Jenkins, RN", email: "s.jenkins@hospital.org", role: "NURSE", status: "ACTIVE", department: "Emergency Triage", license: "RN-449102", lastLogin: "4 mins ago", twoFactorEnabled: true },
  { id: "u3", name: "Alex Rivera, MSc", email: "alex.rivera@hospital.org", role: "MEDICAL_INFORMATICIST", status: "ACTIVE", department: "Clinical Informatics", license: "BIO-10923", lastLogin: "22 mins ago", twoFactorEnabled: true },
  { id: "u4", name: "Marcus Chen", email: "m.chen@hospital.org", role: "IT_ADMIN", status: "ACTIVE", department: "IT Systems", license: "CISSP-98210", lastLogin: "Active session", twoFactorEnabled: true },
  { id: "u5", name: "Dr. James Park, MD", email: "j.park@hospital.org", role: "DOCTOR", status: "INACTIVE", department: "Pulmonology", license: "MD-771092", lastLogin: "3 days ago", twoFactorEnabled: true },
];

const ROLE_COLORS: Record<string, string> = {
  DOCTOR: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NURSE: "bg-sky-50 text-sky-700 border-sky-200",
  MEDICAL_INFORMATICIST: "bg-purple-50 text-purple-700 border-purple-200",
  IT_ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserItem[]>(INITIAL_DEMO_USERS);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [managingUser, setManagingUser] = React.useState<UserItem | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);

  // New User Form State
  const [newUserName, setNewUserName] = React.useState("");
  const [newUserEmail, setNewUserEmail] = React.useState("");
  const [newUserRole, setNewUserRole] = React.useState<UserItem["role"]>("DOCTOR");
  const [newUserDept, setNewUserDept] = React.useState("Cardiology");
  const [newUserLicense, setNewUserLicense] = React.useState("");

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const newUser: UserItem = {
      id: `u${users.length + 1}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: "ACTIVE",
      department: newUserDept,
      license: newUserLicense || "N/A",
      lastLogin: "Never (Invited)",
      twoFactorEnabled: true,
    };

    setUsers([...users, newUser]);
    setShowAddModal(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserLicense("");
    setNotification(`Account for ${newUser.name} created. Activation email with temporary credentials dispatched.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleActive = (userToToggle: UserItem) => {
    const updatedStatus: "ACTIVE" | "INACTIVE" = userToToggle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setUsers(prev =>
      prev.map(u => (u.id === userToToggle.id ? { ...u, status: updatedStatus } : u))
    );
    if (managingUser && managingUser.id === userToToggle.id) {
      setManagingUser({ ...managingUser, status: updatedStatus });
    }
    setNotification(`Account status for ${userToToggle.name} changed to ${updatedStatus}.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase()) ||
      u.license.toLowerCase().includes(search.toLowerCase());
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
            <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
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
      key: "license",
      header: "Clinical License",
      priority: "medium",
      render: (u) => <span className="text-xs font-mono text-slate-500">{u.license}</span>,
    },
    {
      key: "status",
      header: "Account Status",
      priority: "high",
      render: (u) => (
        <Badge className={`border text-xs ${u.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setManagingUser(u)}
          className="h-8 text-xs border-slate-200 hover:border-purple-300 text-purple-700 hover:bg-purple-50 gap-1"
        >
          <span>Manage</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <ResponsivePageContainer
      title="Hospital Staff & User Governance"
      subtitle={`${users.length} registered clinical and IT system accounts with 21 CFR Part 11 zero-knowledge credentials.`}
      actions={
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 text-xs sm:text-sm shadow-xs h-9"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Account</span>
        </Button>
      }
    >
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {notification}
          </span>
          <span className="text-[10px] text-emerald-600 font-mono">Audit Logged</span>
        </div>
      )}

      {/* Staff Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Accounts</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-slate-900">{users.length}</p>
              <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">All Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Sessions</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-emerald-700">
                {users.filter(u => u.status === "ACTIVE").length}
              </p>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Inactive / Suspended</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-slate-600">
                {users.filter(u => u.status === "INACTIVE").length}
              </p>
              <span className="text-[10px] text-slate-400">Terminated</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">2FA Enforcement</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-purple-700">100%</p>
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">MANDATORY</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <ResponsiveToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search accounts by name, email, department, or license..."
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  roleFilter === opt.value
                    ? "bg-slate-900 text-white border-slate-900 font-semibold"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
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
          <div
            key={u.id}
            onClick={() => setManagingUser(u)}
            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-purple-300 transition-all flex items-center justify-between gap-3 cursor-pointer"
          >
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
        )}
      />

      {/* User Management Modal / Drawer */}
      {managingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 font-bold">
                  {managingUser.name[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold">{managingUser.name}</h3>
                  <p className="text-xs text-slate-300 font-mono">{managingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setManagingUser(null)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Assigned Role</p>
                  <Badge className={`mt-1 text-[11px] ${ROLE_COLORS[managingUser.role]}`}>
                    {managingUser.role.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Account Status</p>
                  <div className="mt-1">
                    {managingUser.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                        <span className="h-2 w-2 rounded-full bg-rose-500" /> DISABLED
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Department:</span>
                  <strong className="text-slate-900">{managingUser.department}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Clinical License #:</span>
                  <strong className="font-mono text-slate-900">{managingUser.license}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Last Sign-In:</span>
                  <span className="text-slate-500">{managingUser.lastLogin}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>2FA Hardware / App:</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    ENFORCED (FIDO2)
                  </Badge>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNotification(`Password reset token emailed to ${managingUser.email}.`);
                    setTimeout(() => setNotification(null), 3000);
                  }}
                  className="w-full text-xs h-8 border-slate-200"
                >
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                  Dispatch Password Reset Link
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleToggleActive(managingUser)}
                  className={`w-full text-xs h-8 font-semibold ${
                    managingUser.status === "ACTIVE"
                      ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {managingUser.status === "ACTIVE" ? "Deactivate Staff Account" : "Reactivate Staff Account"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Add Clinical Staff Account</h3>
                <p className="text-xs text-slate-400">Provision credentials with zero-knowledge password hashing.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Staff Member Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Maya Patel, MD"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Official Hospital Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="m.patel@hospital.org"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">System Role</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as UserItem["role"])}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="DOCTOR">Doctor (Physician)</option>
                    <option value="NURSE">Nurse (Bedside/Triage)</option>
                    <option value="MEDICAL_INFORMATICIST">Medical Informaticist</option>
                    <option value="IT_ADMIN">IT Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newUserDept}
                    onChange={e => setNewUserDept(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Emergency Triage">Emergency Triage</option>
                    <option value="Intensive Care (ICU)">Intensive Care (ICU)</option>
                    <option value="Clinical Informatics">Clinical Informatics</option>
                    <option value="IT Systems">IT Systems</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinical License / Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. MD-912048 or RN-330194"
                  value={newUserLicense}
                  onChange={e => setNewUserLicense(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px]">
                <p className="font-bold">Zero-Knowledge Security Policy:</p>
                <p className="mt-0.5">A secure single-use activation token will be dispatched to the staff member&apos;s email address. Administrators never set or see user passwords.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)} className="text-xs h-8">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 font-semibold">
                  Provision Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ResponsivePageContainer>
  );
}

