import { PocketBaseClient } from "./PocketBaseClient";

export interface PocketBaseAuthUser {
  id: string;
  email?: string;
  created?: string;
}

/**
 * PocketBaseAuthService manages auxiliary authentication boundaries.
 *
 * CRITICAL ARCHITECTURAL BOUNDARY:
 * 1. Django REST Framework remains the authoritative Identity Provider.
 * 2. This service NEVER manages clinical credentials, patient medical access,
 *    or doctor permissions.
 * 3. PocketBase superuser/admin credentials must NEVER be placed in client code.
 */
export class PocketBaseAuthService {
  private pbClient: PocketBaseClient;

  constructor(client?: PocketBaseClient) {
    this.pbClient = client || PocketBaseClient.getInstance();
  }

  /**
   * Returns true if an auxiliary PocketBase session exists.
   */
  public isAuthenticated(): boolean {
    return this.pbClient.getRawClient().authStore.isValid;
  }

  /**
   * Retrieves the auxiliary user record from PocketBase authStore if available.
   */
  public getCurrentUser(): PocketBaseAuthUser | null {
    const rawRecord = this.pbClient.getRawClient().authStore.record;
    if (!rawRecord) return null;

    return {
      id: rawRecord.id,
      email: typeof rawRecord.email === "string" ? rawRecord.email : undefined,
      created: typeof rawRecord.created === "string" ? rawRecord.created : undefined,
    };
  }

  /**
   * Clears the auxiliary PocketBase authentication store.
   */
  public clearAuth(): void {
    this.pbClient.getRawClient().authStore.clear();
  }

  /**
   * Imports an auxiliary auth token (e.g., from an authorized backend exchange).
   */
  public setAuthToken(token: string): void {
    this.pbClient.getRawClient().authStore.save(token, null);
  }
}
