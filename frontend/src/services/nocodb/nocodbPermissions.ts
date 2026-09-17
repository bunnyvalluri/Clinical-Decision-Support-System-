/**
 * Client-side permission gates for NocoDB Healthcare Analytics workspace.
 */
import type { NocoDBDataset } from "./types";

export function canUserAccessDataset(userRole: string | undefined, dataset: NocoDBDataset): boolean {
  if (!userRole) return false;
  const normalized = userRole.toLowerCase();
  if (normalized === "it_admin" || normalized === "admin") return true;

  const allowed = (dataset.allowed_roles || []).map((r) => r.toLowerCase());
  return allowed.includes(normalized);
}

export function canUserMutateData(userRole: string | undefined): boolean {
  if (!userRole) return false;
  const normalized = userRole.toLowerCase();
  return ["it_admin", "admin", "medical_informaticist", "informaticist"].includes(normalized);
}

export function canUserExportDataset(userRole: string | undefined): boolean {
  if (!userRole) return false;
  const normalized = userRole.toLowerCase();
  return ["it_admin", "admin", "medical_informaticist", "informaticist", "doctor", "clinician"].includes(
    normalized
  );
}

export function canUserTriggerSync(userRole: string | undefined): boolean {
  if (!userRole) return false;
  const normalized = userRole.toLowerCase();
  return ["it_admin", "admin", "medical_informaticist", "informaticist"].includes(normalized);
}
