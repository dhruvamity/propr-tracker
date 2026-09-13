"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface HealthData {
  restStatus: "HEALTHY" | "ERROR" | "UNKNOWN";
  wsStatus: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastSyncAt: string;
}

interface ShellContextType {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  health: HealthData;
  refreshHealth: () => Promise<void>;
}

const ShellContext = createContext<ShellContextType | undefined>(undefined);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [health, setHealth] = useState<HealthData>({
    restStatus: "HEALTHY",
    wsStatus: "DISCONNECTED",
    lastSyncAt: "",
  });

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        if (data.health) {
          setHealth(data.health);
        }
      }
    } catch {
      setHealth((h) => ({ ...h, restStatus: "ERROR" }));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchHealth();
    }, 0);
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchHealth]);

  return (
    <ShellContext.Provider
      value={{
        mobileNavOpen,
        setMobileNavOpen,
        toggleMobileNav: () => setMobileNavOpen((o) => !o),
        collapsed,
        setCollapsed,
        toggleCollapsed: () => setCollapsed((c) => !c),
        health,
        refreshHealth: fetchHealth,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error("useShell must be used within ShellProvider");
  }
  return ctx;
}
