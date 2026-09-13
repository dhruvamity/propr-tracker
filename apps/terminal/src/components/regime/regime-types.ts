export type Interval = "5m" | "15m" | "1h";

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n: number;
  q: number;
  x: boolean;
}

export interface Quantiles {
  range: number[];
  persistence: number[];
  samples: number;
}

export interface Timeframe {
  lookback: number;
  label: string;
  hourBaselines: Record<string, Quantiles>;
}

export interface StudyRow {
  name: string;
  samples: number;
  mfeR: number;
  maeR: number;
  ratio: number;
  hit2R: number;
  medianOutcomeR: number;
}

export interface Baseline {
  generatedAt: string;
  dataStart: string;
  dataEnd: string;
  symbol: string;
  regimeSpec: {
    activityHigh: number;
    persistenceHigh: number;
    labels: Record<string, string>;
  };
  timeframes: Record<Interval, Timeframe>;
  sessions: StudyRow[];
  weekdays: StudyRow[];
}

export type Condition = "TREND" | "CHOP" | "GRIND" | "DEAD";

export interface Reading {
  activity: number;
  persistence: number;
  label: Condition;
  range: number;
  change: number;
}

export interface HistoryPoint {
  t: number;
  price: number;
  activity: number;
  persistence: number;
  label: Condition;
  istLabel: string;
}

export interface ConditionMeta {
  name: string;
  tag: string;
  action: string;
  code: string;
  color: string;
  bgTint: string;
  textColor: string;
  badgeTone: "buy" | "amber" | "cyan" | "zinc";
}

export const CONDITION_CONFIG: Record<Condition, ConditionMeta> = {
  TREND: {
    name: "TRENDING",
    tag: "HIGH MOMENTUM",
    action: "Prime breakout and continuation conditions. Volatility & directional persistence are aligned.",
    code: "trend",
    color: "#10b981",
    bgTint: "rgba(16, 185, 129, 0.12)",
    textColor: "text-emerald-400",
    badgeTone: "buy",
  },
  CHOP: {
    name: "CHOPPY",
    tag: "TRAP ZONE",
    action: "High volatility without persistent direction. Whipsaws and fakeouts predominate. Avoid breakout chasing.",
    code: "chop",
    color: "#f59e0b",
    bgTint: "rgba(245, 158, 11, 0.12)",
    textColor: "text-amber-400",
    badgeTone: "amber",
  },
  GRIND: {
    name: "SLOW DRIFT",
    tag: "LOW VOLATILITY",
    action: "Directional drift with small range. Tighten profit targets and avoid expecting explosive extensions.",
    code: "grind",
    color: "#06b6d4",
    bgTint: "rgba(6, 182, 212, 0.10)",
    textColor: "text-cyan-400",
    badgeTone: "cyan",
  },
  DEAD: {
    name: "DEAD / FLAT",
    tag: "STAND ASIDE",
    action: "Market is dormant with low volume and compressed range. Zero statistical edge. Preserve capital.",
    code: "dead",
    color: "#a1a1aa",
    bgTint: "rgba(161, 161, 170, 0.08)",
    textColor: "text-zinc-400",
    badgeTone: "zinc",
  },
};
