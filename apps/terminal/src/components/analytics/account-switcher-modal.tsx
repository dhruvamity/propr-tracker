"use client";

import React, { useState } from "react";
import type { AccountSnapshot } from "@/lib/types";
import { isTradingActive, isAccountFailed } from "@propr/data-model";
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
      if (isTradingActive(a.stage)) fav.add(a.accountId);
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
    const isFailed = isAccountFailed(acc.stage);
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

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-sm font-semibold text-white">Select Account</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Switch trading account context across all analytical views
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
          {(["ALL", "FAVORITES", "BREACHED", "ARCHIVED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab === "ALL" && `All (${accounts.length})`}
              {tab === "FAVORITES" && `Favorites (${favorites.size})`}
              {tab === "BREACHED" && "Breached"}
              {tab === "ARCHIVED" && "Archived"}
            </button>
          ))}
        </div>

        {/* Account List */}
        <div className="overflow-y-auto divide-y divide-[var(--border-subtle)] flex-1">
          {filteredAccounts.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              No accounts match the selected filter.
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isSelected = acc.accountId === selectedAccountId;
              const isFav = favorites.has(acc.accountId);
              const isFailed = isAccountFailed(acc.stage);
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
                  {/* Left: Star + Icon + Name + Tag */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(acc.accountId, e)}
                      aria-label={isFav ? "Remove favorite" : "Add to favorites"}
                      className={`p-1 rounded transition-colors ${
                        isFav ? "text-amber-400" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      title={isFav ? "Remove favorite" : "Favorite"}
                    >
                      <Star size={14} fill={isFav ? "currentColor" : "none"} />
                    </button>

                    {/* Propr geometric glyph */}
                    <div className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 text-xs font-bold">
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
                          <span className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 block">
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
