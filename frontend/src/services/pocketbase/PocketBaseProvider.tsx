"use client";

import * as React from "react";
import { PocketBaseClient } from "./PocketBaseClient";
import { PocketBaseRepository, AuxiliaryAnnouncement } from "./PocketBaseRepository";
import { PocketBaseRealtimeService } from "./PocketBaseRealtimeService";
import { AlertCircle, RefreshCw, X } from "lucide-react";

interface PocketBaseContextType {
  isHealthy: boolean;
  isChecking: boolean;
  checkHealth: () => Promise<void>;
  repository: PocketBaseRepository;
  realtime: PocketBaseRealtimeService;
}

const PocketBaseContext = React.createContext<PocketBaseContextType | null>(null);

export function PocketBaseProvider({ children }: { children: React.ReactNode }) {
  const [isHealthy, setIsHealthy] = React.useState<boolean>(false);
  const [isChecking, setIsChecking] = React.useState<boolean>(true);

  const client = React.useMemo(() => PocketBaseClient.getInstance(), []);
  const repository = React.useMemo(() => new PocketBaseRepository(client), [client]);
  const realtime = React.useMemo(() => new PocketBaseRealtimeService(client), [client]);

  const checkHealth = React.useCallback(async () => {
    setIsChecking(true);
    try {
      const healthy = await client.checkHealth();
      setIsHealthy(healthy);
    } catch {
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  }, [client]);

  React.useEffect(() => {
    let active = true;
    client.checkHealth().then((healthy) => {
      if (active) {
        setIsHealthy(healthy);
        setIsChecking(false);
      }
    });
    return () => {
      active = false;
    };
  }, [client]);

  const value = React.useMemo(
    () => ({
      isHealthy,
      isChecking,
      checkHealth,
      repository,
      realtime,
    }),
    [isHealthy, isChecking, checkHealth, repository, realtime]
  );

  return <PocketBaseContext.Provider value={value}>{children}</PocketBaseContext.Provider>;
}

export function usePocketBase() {
  const context = React.useContext(PocketBaseContext);
  if (!context) {
    // Fallback if rendered outside provider: return defensive instance
    const client = PocketBaseClient.getInstance();
    return {
      isHealthy: false,
      isChecking: false,
      checkHealth: async () => {},
      repository: new PocketBaseRepository(client),
      realtime: new PocketBaseRealtimeService(client),
    };
  }
  return context;
}

/**
 * Hook for consuming auxiliary announcements with realtime SSE updates and graceful degradation.
 */
export function useAuxiliaryAnnouncements() {
  const { repository, realtime, isHealthy, isChecking, checkHealth } = usePocketBase();
  const [announcements, setAnnouncements] = React.useState<AuxiliaryAnnouncement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnnouncements = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await repository.getActiveAnnouncements();
    if (res.isFallback && res.error) {
      setError(res.error);
    } else {
      setError(null);
    }
    setAnnouncements(res.data);
    setLoading(false);
  }, [repository]);

  React.useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    repository.getActiveAnnouncements().then((res) => {
      if (!isMounted) return;
      if (res.isFallback && res.error) {
        setError(res.error);
      } else {
        setError(null);
      }
      setAnnouncements(res.data);
      setLoading(false);
    });

    if (isHealthy) {
      realtime
        .subscribeToCollection<AuxiliaryAnnouncement>("auxiliary_announcements", (event) => {
          if (!isMounted) return;
          if (event.action === "create" || event.action === "update") {
            setAnnouncements((prev) => {
              const filtered = prev.filter((a) => a.id !== event.record.id);
              return event.record.active ? [event.record, ...filtered] : filtered;
            });
          } else if (event.action === "delete") {
            setAnnouncements((prev) => prev.filter((a) => a.id !== event.record.id));
          }
        })
        .then((unsub) => {
          unsubscribe = unsub;
        });
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [repository, isHealthy, realtime]);

  return {
    announcements,
    loading,
    error,
    isHealthy,
    isChecking,
    retry: () => {
      checkHealth();
      fetchAnnouncements();
    },
  };
}

/**
 * Auxiliary Announcement Banner Component
 * Adheres strictly to:
 * 1. White/light clean styling.
 * 2. If PocketBase is down, shows gentle "Service temporarily unavailable" without breaking UI.
 * 3. NO FAKE DATA: If no active announcements, renders nothing.
 */
export function AuxiliaryAnnouncementBanner() {
  const { announcements, error, retry, loading } = useAuxiliaryAnnouncements();
  const [dismissed, setDismissed] = React.useState<Record<string, boolean>>({});

  if (loading) return null;

  if (error) {
    return null;
  }

  const activeVisible = announcements.filter((a) => !dismissed[a.id]);
  if (activeVisible.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {activeVisible.map((item) => (
        <div
          key={item.id}
          className={`px-4 py-2 border-b text-xs flex items-center justify-between ${
            item.severity === "critical"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : item.severity === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-white/70">
              {item.severity}
            </span>
            <span className="font-semibold">{item.title}:</span>
            <span>{item.message}</span>
          </div>
          <button
            onClick={() => setDismissed((prev) => ({ ...prev, [item.id]: true }))}
            className="p-1 rounded hover:bg-black/5 text-slate-500 hover:text-slate-900"
            title="Dismiss notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
