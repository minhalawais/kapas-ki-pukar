"use client";

import type { NamedCount } from "@kapas/domain";
import { t } from "@kapas/localization";
import { Activity, BarChart3, CircleDot, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import { useLocaleStore } from "@/stores/locale-store";

const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"] as const;

function DataTable({ title, rows, labelFor }: { title: string; rows: NamedCount[]; labelFor: (key: string) => string }) {
  const locale = useLocaleStore((s) => s.locale);
  return <details className="mt-3 border-t border-border pt-2"><summary className="cursor-pointer text-xs font-semibold text-action">{t(locale, "portal.chart.viewData")}</summary><table className="mt-2 w-full text-xs"><caption className="sr-only">{title}</caption><tbody>{rows.map((row) => <tr key={row.key} className="border-t border-border first:border-0"><th scope="row" className="py-1.5 text-start font-medium text-ink">{labelFor(row.key)}</th><td className="py-1.5 text-end tabular-nums text-muted">{row.count}</td></tr>)}</tbody></table></details>;
}

function total(rows: NamedCount[]): number {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

export function ExecutiveTrendChart({ title, rows, emptyLabel }: { title: string; rows: NamedCount[]; emptyLabel: string }) {
  return <Card className="flex h-full flex-col justify-between p-4"><div className="flex items-center gap-2"><TrendingUp aria-hidden size={17} className="text-info" /><h2 className="text-sm font-semibold text-ink">{title}</h2></div>{rows.length === 0 ? <p className="mt-3 text-xs text-muted">{emptyLabel}</p> : <><div className="mt-3 h-[380px] min-h-[380px] w-full flex-1" role="img" aria-label={`${title}: ${rows.map((row) => `${row.key} ${row.count}`).join(", ")}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} margin={{ top: 8, right: 18, bottom: 2, left: -18 }}><defs><linearGradient id="dashboardTrend" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.36} /><stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="key" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} /><Area type="monotone" dataKey="count" stroke="var(--chart-3)" strokeWidth={2.5} fill="url(#dashboardTrend)" activeDot={{ r: 5 }} /></AreaChart></ResponsiveContainer></div><DataTable title={title} rows={rows} labelFor={(key) => key} /></>}</Card>;
}

export function DonutChart({
  title,
  rows,
  labelFor,
  emptyLabel,
  colorFor,
}: {
  title: string;
  rows: NamedCount[];
  labelFor: (key: string) => string;
  emptyLabel: string;
  colorFor?: (key: string, index: number) => string;
}) {
  const data = rows.map((row) => ({ ...row, label: labelFor(row.key) }));
  const sum = total(rows);
  const lead = data[0];
  return <Card className="p-4"><div className="flex items-center gap-2"><CircleDot aria-hidden size={17} className="text-[var(--brand-fos-teal-dark)]" /><h2 className="text-sm font-semibold text-ink">{title}</h2></div>{rows.length === 0 ? <p className="mt-3 text-xs text-muted">{emptyLabel}</p> : <><div className="mt-3 grid min-h-64 grid-cols-[190px_minmax(0,1fr)] items-center gap-2 max-sm:grid-cols-1" role="img" aria-label={`${title}: ${data.map((row) => `${row.label} ${row.count}`).join(", ")}`}><div className="relative h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="count" nameKey="label" innerRadius={58} outerRadius={82} paddingAngle={2}>{data.map((row, index) => <Cell key={row.key} fill={colorFor?.(row.key, index) ?? SERIES[index % SERIES.length]} />)}</Pie><Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-[11px] font-semibold text-muted">{lead?.label}</p><p className="text-2xl font-semibold tabular-nums text-ink">{lead ? Math.round((lead.count / sum) * 100) : 0}%</p></div></div></div><div className="space-y-2">{data.slice(0, 6).map((row, index) => <div key={row.key} className="flex items-center justify-between gap-3 text-xs"><span className="inline-flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorFor?.(row.key, index) ?? SERIES[index % SERIES.length] }} /><span className="truncate text-ink">{row.label}</span></span><span className="tabular-nums text-muted">{row.count}</span></div>)}</div></div><DataTable title={title} rows={rows} labelFor={labelFor} /></>}</Card>;
}

export function RankedList({
  title,
  rows,
  labelFor,
  emptyLabel,
  colorFor,
}: {
  title: string;
  rows: NamedCount[];
  labelFor: (key: string) => string;
  emptyLabel: string;
  colorFor?: (key: string, index: number) => string;
}) {
  const data = rows.map((row) => ({ ...row, label: labelFor(row.key) }));
  const max = Math.max(...data.map((row) => row.count), 1);
  return <Card className="p-4"><div className="flex items-center gap-2"><BarChart3 aria-hidden size={17} className="text-[var(--brand-fos-teal-dark)]" /><h2 className="text-sm font-semibold text-ink">{title}</h2></div>{data.length === 0 ? <p className="mt-3 text-xs text-muted">{emptyLabel}</p> : <><div className="mt-4 space-y-3">{data.slice(0, 7).map((row, index) => <div key={row.key}><div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium text-ink">{row.label}</span><span className="tabular-nums text-muted">{row.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-page"><div className="h-full rounded-full" style={{ width: `${Math.max(6, (row.count / max) * 100)}%`, background: colorFor?.(row.key, index) ?? SERIES[index % SERIES.length] }} /></div></div>)}</div><DataTable title={title} rows={rows} labelFor={labelFor} /></>}</Card>;
}

export function SignalCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "critical" | "warning" | "success";
}) {
  const toneClass = {
    neutral: "bg-page text-muted",
    critical: "bg-[#FCEAEA] text-critical",
    warning: "bg-[var(--surface-soft-gold)] text-[#9B5B08]",
    success: "bg-[#E5F4EB] text-success",
  }[tone];
  return <div className="rounded-card border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 text-2xl font-semibold text-ink tabular-nums">{value}</p></div><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-control ${toneClass}`}><Activity size={17} /></span></div><p className="mt-2 text-xs leading-5 text-muted">{helper}</p></div>;
}
