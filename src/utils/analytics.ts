import { Transaction, User, UserScheme } from '../types';

export type TimeBucket = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SeriesPoint {
  label: string;
  value: number;
}

/**
 * Computes a simple moving average over the provided series values.
 * Keeps the output length equal to input by averaging over the available window at the start.
 */
export const simpleMovingAverage = (values: number[], windowSize: number = 7): number[] => {
  if (windowSize <= 1) return [...values];
  const result: number[] = new Array(values.length).fill(0);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= windowSize) {
      sum -= values[i - windowSize];
    }
    const denom = Math.min(i + 1, windowSize);
    result[i] = sum / denom;
  }
  return result;
};

export const groupTransactionsByDay = (transactions: Transaction[], days: number = 30): SeriesPoint[] => {
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const map: Record<string, number> = {};

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    map[key] = 0;
  }

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = d.toISOString().slice(0, 10);
    if (key in map) map[key] += t.amount;
  }

  return Object.entries(map)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => ({ label: k, value: v }));
};

export const groupTransactionsByMonth = (transactions: Transaction[], year: number = new Date().getFullYear()): SeriesPoint[] => {
  const map: Record<number, number> = {};
  for (let m = 0; m < 12; m++) map[m] = 0;

  for (const t of transactions) {
    const d = new Date(t.date);
    if (d.getFullYear() !== year) continue;
    map[d.getMonth()] += t.amount;
  }

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return Object.keys(map)
    .map((m) => parseInt(m, 10))
    .sort((a, b) => a - b)
    .map((m) => ({ label: monthLabels[m], value: map[m] }));
};

export const paymentModeDistribution = (transactions: Transaction[]): { labels: string[]; values: number[] } => {
  const counts: Record<string, number> = { offline: 0, card: 0, upi: 0, netbanking: 0 };
  for (const t of transactions) counts[t.paymentMode] = (counts[t.paymentMode] || 0) + 1;
  const labels = Object.keys(counts);
  const values = labels.map((k) => counts[k]);
  return { labels, values };
};

export const amountBySchemeType = (transactions: Transaction[], userSchemes: UserScheme[]): { labels: string[]; values: number[] } => {
  const schemeMap = new Map(userSchemes.map((s) => [s.id, s.schemeType.name]));
  const sums: Record<string, number> = {};
  for (const t of transactions) {
    const schemeName = schemeMap.get(t.schemeId) || 'Unknown';
    sums[schemeName] = (sums[schemeName] || 0) + t.amount;
  }
  const labels = Object.keys(sums);
  const values = labels.map((k) => sums[k]);
  return { labels, values };
};

export const userGrowthByMonth = (users: User[], year: number = new Date().getFullYear()): SeriesPoint[] => {
  const map: Record<number, number> = {};
  for (let m = 0; m < 12; m++) map[m] = 0;
  for (const u of users) {
    const d = new Date(u.createdAt);
    if (d.getFullYear() !== year) continue;
    map[d.getMonth()] += 1;
  }
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return Object.keys(map)
    .map((m) => parseInt(m, 10))
    .sort((a, b) => a - b)
    .map((m) => ({ label: monthLabels[m], value: map[m] }));
};
