import { PocketBaseClient } from "./PocketBaseClient";

export interface AuxiliaryAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  active: boolean;
  created?: string;
  updated?: string;
}

export interface UserUiPreferences {
  id?: string;
  user_id: string;
  density?: "compact" | "comfortable";
  pinned_widgets?: string[];
  dismissed_banners?: string[];
}

export interface RepositoryResult<T> {
  data: T;
  isFallback: boolean;
  error?: string;
}

/**
 * PocketBaseRepository handles strictly non-clinical auxiliary data persistence.
 *
 * MANDATORY RULE (Prompt 25 - Section 26):
 * NO FAKE DATA. If collections are empty or unreachable, return empty data or clear
 * empty-state signals. Do not generate fake records.
 */
export class PocketBaseRepository {
  private pbClient: PocketBaseClient;

  constructor(client?: PocketBaseClient) {
    this.pbClient = client || PocketBaseClient.getInstance();
  }

  /**
   * Fetches active non-clinical system announcements.
   * Gracefully returns an empty array if PocketBase is offline or collection is empty.
   */
  public async getActiveAnnouncements(): Promise<RepositoryResult<AuxiliaryAnnouncement[]>> {
    try {
      const records = await this.pbClient
        .getRawClient()
        .collection("auxiliary_announcements")
        .getFullList({
          filter: "active = true",
          sort: "-created",
          requestKey: "active_announcements",
        });

      const announcements: AuxiliaryAnnouncement[] = records.map((r) => ({
        id: r.id,
        title: String(r.title || ""),
        message: String(r.message || ""),
        severity: (r.severity as "info" | "warning" | "critical") || "info",
        active: Boolean(r.active),
        created: r.created,
        updated: r.updated,
      }));

      return { data: announcements, isFallback: false };
    } catch (err: unknown) {
      // Graceful degradation when PocketBase is unreachable or collection uninitialized
      const errorMsg = err instanceof Error ? err.message : "PocketBase service unavailable";
      return { data: [], isFallback: true, error: errorMsg };
    }
  }

  /**
   * Fetches non-clinical UI preferences for an authenticated user.
   */
  public async getUserPreferences(userId: string): Promise<RepositoryResult<UserUiPreferences | null>> {
    if (!userId) {
      return { data: null, isFallback: false };
    }

    try {
      const record = await this.pbClient
        .getRawClient()
        .collection("user_ui_preferences")
        .getFirstListItem(`user_id = "${userId}"`, {
          requestKey: `pref_${userId}`,
        });

      const prefs: UserUiPreferences = {
        id: record.id,
        user_id: String(record.user_id),
        density: (record.density as "compact" | "comfortable") || "comfortable",
        pinned_widgets: Array.isArray(record.pinned_widgets) ? record.pinned_widgets : [],
        dismissed_banners: Array.isArray(record.dismissed_banners) ? record.dismissed_banners : [],
      };

      return { data: prefs, isFallback: false };
    } catch {
      // Return null with fallback flag on offline or not found
      return { data: null, isFallback: true };
    }
  }

  /**
   * Updates non-clinical UI preferences without blocking clinical workflows.
   */
  public async saveUserPreferences(
    userId: string,
    prefs: Partial<UserUiPreferences>
  ): Promise<RepositoryResult<UserUiPreferences | null>> {
    if (!userId) {
      return { data: null, isFallback: false, error: "Missing user identifier" };
    }

    try {
      const collection = this.pbClient.getRawClient().collection("user_ui_preferences");
      let existingId: string | null = null;

      try {
        const existing = await collection.getFirstListItem(`user_id = "${userId}"`);
        existingId = existing.id;
      } catch {
        existingId = null;
      }

      const payload = {
        user_id: userId,
        density: prefs.density || "comfortable",
        pinned_widgets: prefs.pinned_widgets || [],
        dismissed_banners: prefs.dismissed_banners || [],
      };

      let resultRecord;
      if (existingId) {
        resultRecord = await collection.update(existingId, payload);
      } else {
        resultRecord = await collection.create(payload);
      }

      return {
        data: {
          id: resultRecord.id,
          user_id: String(resultRecord.user_id),
          density: (resultRecord.density as "compact" | "comfortable") || "comfortable",
          pinned_widgets: Array.isArray(resultRecord.pinned_widgets) ? resultRecord.pinned_widgets : [],
          dismissed_banners: Array.isArray(resultRecord.dismissed_banners) ? resultRecord.dismissed_banners : [],
        },
        isFallback: false,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to persist UI preferences";
      return { data: null, isFallback: true, error: errorMsg };
    }
  }
}
