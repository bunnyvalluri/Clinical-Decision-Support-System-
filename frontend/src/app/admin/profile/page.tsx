"use client";

import * as React from "react";
import { useAuthStore } from "@/features/auth/authStore";
import {
  Shield,
  ShieldCheck,
  Mail,
  Building2,
  BadgeCheck,
  User,
  Key,
  Lock,
  Smartphone,
  Fingerprint,
  CheckCircle2,
  Clock,
  RefreshCw,
  Award,
  AlertTriangle,
  Server,
  FileCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function AdminProfilePage() {
  const { user } = useAuthStore();
  const [isRotateModalOpen, setIsRotateModalOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRotateKeys = () => {
    setIsRotateModalOpen(false);
    showToast("Cryptographic credentials rotated: Issued new Ed25519 admin keypair. Signed to audit ledger.");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold">
              Root Infrastructure Admin
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> FIDO2 Hardware Key Enforced
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-purple-600" />
            Administrator Profile & Credentials
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Certified root access identity, cryptographic signing keypairs, and privilege governance boundaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRotateModalOpen(true)}
            className="text-xs font-semibold gap-1.5 border-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
            Rotate Signing Keys
          </Button>
        </div>
      </div>

      {/* Profile Hero Card */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 relative" />
        <CardContent className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-6">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl bg-slate-900 border-4 border-white shadow-md flex items-center justify-center text-white shrink-0">
                <Shield className="h-10 w-10 text-purple-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {user?.full_name || "Marcus Chen"}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800 border-0 text-xs font-semibold">
                    IT System Administrator (IT_ADMIN)
                  </Badge>
                  <Badge variant="outline" className="text-xs font-mono text-slate-600">
                    Staff ID: EMP-00109
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Security Clearance</span>
              <span className="text-xs font-bold text-emerald-700">HIPAA Class III & SaMD Admin</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Mail className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Email Address</p>
                <p className="text-xs font-semibold text-slate-900 mt-0.5 truncate">
                  {user?.email || "m.chen@hospital.org"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Building2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Department</p>
                <p className="text-xs font-semibold text-slate-900 mt-0.5 truncate">
                  {user?.department || "IT Systems & Cybersecurity"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <BadgeCheck className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Professional License</p>
                <p className="text-xs font-semibold text-slate-900 mt-0.5 truncate">
                  {user?.license_number || "CISSP-98210 / CISA"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <User className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">System Username</p>
                <p className="text-xs font-semibold text-slate-900 mt-0.5 font-mono">
                  {user?.username || "mchen"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Key className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Access Tier</p>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">
                  Tier 0 Root Infrastructure
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Fingerprint className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">2FA Authentication</p>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                  Hardware Key (FIDO2) Enforced
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Tokens & Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">Hardware Authenticators & Keys</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Physical FIDO2 WebAuthn tokens registered to this administrative account.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  Y5
                </div>
                <div>
                  <p className="font-bold text-slate-900">YubiKey 5C NFC (Primary)</p>
                  <p className="text-[11px] text-slate-500 font-mono">Serial: #8492019 • FIDO2 / WebAuthn</p>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                ACTIVE
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Smartphone className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="font-bold text-slate-900">TOTP Authenticator App</p>
                  <p className="text-[11px] text-slate-500 font-mono">Time-based 6-digit backup code</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold text-slate-600">
                BACKUP
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">Active Workstation Session</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Current network perimeter origin, TLS handshake cipher, and session validity.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Workstation IP</span>
                <span className="font-mono font-semibold text-slate-900">10.240.10.01 (Admin VLAN)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">TLS Protocol</span>
                <span className="font-mono font-semibold text-emerald-700">TLS 1.3 ECDHE-RSA</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Idle Expiration</span>
                <span className="text-[11px] font-semibold text-purple-700">15 min policy (Active)</span>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 text-xs flex items-start gap-2">
              <Lock className="h-4 w-4 text-purple-700 shrink-0 mt-0.5" />
              <span>
                Zero standing root access enforced. Privileged database mutations require dual cryptographic sign-off.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rotate Keys Modal */}
      {isRotateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsRotateModalOpen(false)}
          title="Rotate Administrator Ed25519 Signing Keypair"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Rotating administrative signing keys will immediately revoke all previous digital signature certificates
              and issue a fresh Ed25519 keypair for 21 CFR Part 11 audit records.
            </p>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Active sessions on secondary administrative workstations will be prompted to re-authenticate with their hardware token.
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRotateModalOpen(false)}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRotateKeys}
                className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white"
              >
                Confirm Key Rotation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
