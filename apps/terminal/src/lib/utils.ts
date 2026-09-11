import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === "" || val === "NaN") return "$0.00";
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatINR(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === "" || val === "NaN") return "₹0.00";
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPercent(val: string | number | undefined | null, decimals = 2, showPlus = false): string {
  if (val === undefined || val === null || val === "" || val === "NaN") return `0.${"0".repeat(decimals)}%`;
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return `0.${"0".repeat(decimals)}%`;
  const sign = showPlus && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(decimals)}%`;
}

export function formatNumber(val: string | number | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || val === "" || val === "NaN") return `0.${"0".repeat(decimals)}`;
  const n = Number(val);
  if (isNaN(n) || !isFinite(n)) return `0.${"0".repeat(decimals)}`;
  return n.toFixed(decimals);
}

export function formatShortId(id: string): string {
  if (!id) return "";
  return id.replace(/^urn:[^:]+:/, "");
}

export function formatAccountTag(id: string): string {
  if (!id) return "";
  const raw = id.replace(/^urn:[^:]+:/, "");
  return `#${raw.slice(-4)}`;
}

