"use client";

import React, { useState } from "react";
import type { AccountSnapshot } from "@/lib/propr-api";
import { formatUSD, formatShortId, formatAccountTag } from "@/lib/utils";
import { Star, X, Check } from "lucide-react";

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSnapshot[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
}

type TabType = "ALL" | "FAVORITES" | "BREACHED" | "ARCHIVED";

export function AccountSwitcherModal({
  isOpen,
  onClose,
  accounts,
  selectedAccountId,
  onSelectAccount,
}: AccountSwitcherModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    // Default favorite is the active explorer account
    const fav = new Set<string>();
    accounts.forEach((a) => {
      if (a.stage === "EVALUATION" || a.stage === "FUNDED") fav.add(a.accountId);
    });
    return fav;
  });

  if (!isOpen) return null;

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredAccounts = accounts.filter((acc) => {
    const isFailed = acc.stage === "FAILED" || acc.stage === "BREACHED" || acc.stage === "CLOSED";
    if (activeTab === "FAVORITES") return favorites.has(acc.accountId);
    if (activeTab === "BREACHED") return isFailed;
    if (activeTab === "ARCHIVED") return isFailed;
    return true; // "ALL"
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Header Tabs & Close Button */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-1 text-xs">
            {(["ALL", "FAVORITES", "BREACHED", "ARCHIVED"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Account List */}
        <div className="divide-y divide-[var(--border-subtle)] max-h-96 overflow-y-auto">
          {filteredAccounts.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No accounts in this view.
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isSelected = acc.accountId === selectedAccountId;
              const isFav = favorites.has(acc.accountId);
              const isFailed = acc.stage === "FAILED" || acc.stage === "BREACHED" || acc.stage === "CLOSED";
              const tag = formatAccountTag(acc.accountId);
              const equity = Number(acc.equity || acc.balance || acc.initialBalance || 0);

              return (
                <div
                  key={acc.accountId}
                  onClick={() => {
                    onSelectAccount(acc.accountId);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors ${
                    isSelected ? "bg-white/[0.04]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Star toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(acc.accountId, e)}
                      className={`p-1 rounded transition-colors ${
                        isFav ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"
                      }`}
                      title={isFav ? "Remove favorite" : "Favorite"}
                    >
                      <Star size={14} fill={isFav ? "currentColor" : "none"} />
                    </button>

                    {/* Propr geometric glyph */}
                    <div className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                      P
                    </div>

                    {/* Account Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {acc.challengeName || "Starter Turbo"}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {tag}
                        </span>
                        {isFailed ? (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-950/60 text-red-400 border border-red-800/50 uppercase">
                            BREACHED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 uppercase">
                            PAPER
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 block">
                        {formatShortId(acc.accountId)}
                      </span>
                    </div>
                  </div>

                  {/* Equity & Selected check */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-white">
                      {formatUSD(equity)}
                    </span>
                    {isSelected && (
                      <Check size={14} className="text-emerald-400 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
