import { RecordSubscription, UnsubscribeFunc } from "pocketbase";
import { PocketBaseClient } from "./PocketBaseClient";

export type RealtimeEventHandler<T = Record<string, unknown>> = (data: {
  action: "create" | "update" | "delete";
  record: T;
}) => void;

/**
 * PocketBaseRealtimeService manages Server-Sent Events (SSE) connections for
 * auxiliary non-clinical events (e.g., UI broadcast banners).
 *
 * NOTE:
 * Clinical real-time events (vitals telemetry, emergency codes, multi-doctor reviews)
 * MUST continue to flow through Django Channels + Redis WebSockets.
 */
export class PocketBaseRealtimeService {
  private pbClient: PocketBaseClient;
  private activeSubscriptions: Map<string, UnsubscribeFunc> = new Map();

  constructor(client?: PocketBaseClient) {
    this.pbClient = client || PocketBaseClient.getInstance();
  }

  /**
   * Subscribes to an authorized auxiliary collection with strict lifecycle management.
   * Returns an unsubscribe function guaranteed to release SSE resources.
   */
  public async subscribeToCollection<T = Record<string, unknown>>(
    collectionName: string,
    callback: RealtimeEventHandler<T>,
    topic: string = "*"
  ): Promise<UnsubscribeFunc> {
    const subscriptionKey = `${collectionName}:${topic}`;

    // Prevent duplicate subscriptions to the same topic
    if (this.activeSubscriptions.has(subscriptionKey)) {
      const existingUnsub = this.activeSubscriptions.get(subscriptionKey);
      if (existingUnsub) {
        try {
          await existingUnsub();
        } catch {
          // Ignore cleanup errors on duplicate override
        }
      }
      this.activeSubscriptions.delete(subscriptionKey);
    }

    const rawClient = this.pbClient.getRawClient();

    try {
      const unsub = await rawClient
        .collection(collectionName)
        .subscribe(topic, (e: RecordSubscription<Record<string, unknown>>) => {
          // Strict validation of incoming payload
          if (!e || !e.record || !e.action) {
            return;
          }

          callback({
            action: e.action as "create" | "update" | "delete",
            record: e.record as unknown as T,
          });
        });

      const safeUnsub: UnsubscribeFunc = async () => {
        try {
          await unsub();
        } catch {
          // Safe swallow on already disconnected SSE stream
        } finally {
          this.activeSubscriptions.delete(subscriptionKey);
        }
      };

      this.activeSubscriptions.set(subscriptionKey, safeUnsub);
      return safeUnsub;
    } catch (err) {
      console.warn(`[PocketBaseRealtime] Subscription to ${collectionName} failed:`, err);
      // Return a no-op cleanup function on connection failure to avoid component crashes
      return async () => {};
    }
  }

  /**
   * Unsubscribes from all active subscriptions (e.g. on logout or teardown).
   */
  public async unsubscribeAll(): Promise<void> {
    for (const [key, unsub] of this.activeSubscriptions.entries()) {
      try {
        await unsub();
      } catch {
        // Safe swallow
      }
      this.activeSubscriptions.delete(key);
    }
  }
}
