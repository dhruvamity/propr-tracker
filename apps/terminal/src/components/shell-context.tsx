"use client";

import React, { createContext, useContext, useState } from "react";

interface ShellContextType {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const ShellContext = createContext<ShellContextType | undefined>(undefined);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ShellContext.Provider
      value={{
        mobileNavOpen,
        setMobileNavOpen,
        toggleMobileNav: () => setMobileNavOpen((o) => !o),
        collapsed,
        setCollapsed,
        toggleCollapsed: () => setCollapsed((c) => !c),
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
