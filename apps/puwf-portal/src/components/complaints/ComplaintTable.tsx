"use client";

import type { Complaint } from "@kapas/domain";
import { t, type MessageKey } from "@kapas/localization";
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ClockAlert, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { PriorityBadge, PrivacyBadge, StatusBadge } from "@/components/ui/semantic-badge";
import { locationLabel } from "@/lib/dashboard";
import { useLocaleStore } from "@/stores/locale-store";

function dateCell(value: string, locale: "en" | "ur"): string {
  return new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-PK", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function ComplaintTable({ rows }: { rows: Complaint[] }) {
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo<ColumnDef<Complaint>[]>(() => [
    { accessorKey: "trackingId", header: t(locale, "portal.table.id"), cell: ({ row }) => <div className="space-y-1"><Link href={`/complaints/${row.original.trackingId}`} className="font-mono font-semibold text-action hover:underline" dir="ltr">{row.original.trackingId}</Link><div className="text-[11px] text-muted">{dateCell(row.original.submittedAt, locale)}</div></div> },
    { id: "category", accessorKey: "categoryCode", header: t(locale, "portal.table.issue"), cell: ({ row }) => <div className="max-w-52"><div className="font-semibold text-ink">{t(locale, `category.${row.original.categoryCode}` as MessageKey)}</div>{row.original.subcategoryCode ? <div className="mt-0.5 truncate text-[11px] text-muted">{row.original.subcategoryCode}</div> : null}</div> },
    { id: "location", accessorFn: (row) => locationLabel(row), header: t(locale, "portal.table.workerLocation"), cell: ({ row }) => <div className="space-y-1.5"><div className="flex max-w-64 items-center gap-1.5 text-ink"><MapPin aria-hidden size={14} className="shrink-0 text-muted" /><span className="truncate">{locationLabel(row.original) || t(locale, "portal.case.notAvailable")}</span></div><PrivacyBadge privacy={row.original.privacyMode} /></div> },
    { id: "risk", accessorFn: (row) => `${row.priority}-${row.overdue}`, header: t(locale, "portal.table.risk"), cell: ({ row }) => <div className="space-y-1.5"><PriorityBadge priority={row.original.priority} />{row.original.overdue ? <div className="flex items-center gap-1 text-[11px] font-semibold text-critical"><ClockAlert size={13} />{t(locale, "portal.case.overdue")}</div> : <div className="text-[11px] text-muted">{t(locale, "portal.case.due")} {dateCell(row.original.dueAt, locale)}</div>}</div> },
    { accessorKey: "status", header: t(locale, "portal.table.status"), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: "updatedAt", header: t(locale, "portal.table.updated"), cell: ({ row }) => <span className="whitespace-nowrap text-muted">{dateCell(row.original.updatedAt, locale)}</span> },
  ], [locale]);

  const table = useReactTable({ data: rows, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 20 } } });
  const pageCount = table.getPageCount() || 1;

  return (
    <div className="overflow-hidden bg-surface">
      <div className="max-h-[620px] overflow-auto">
        <table className="w-full min-w-[820px] text-start text-[13px] leading-[18px] text-ink">
          <caption className="sr-only">{t(locale, "portal.table.caption")}</caption>
          <thead className="sticky top-0 z-10 border-b border-border bg-page text-xs text-muted shadow-[0_1px_0_var(--border)]">
            {table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => { const sorted = header.column.getIsSorted(); return <th key={header.id} scope="col" className="px-4 py-2.5 text-start font-semibold" aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}>{header.isPlaceholder ? null : header.column.getCanSort() ? <button type="button" className="inline-flex min-h-8 items-center gap-1 text-start" onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{sorted === "asc" ? <ArrowUp size={13} /> : sorted === "desc" ? <ArrowDown size={13} /> : <ArrowUpDown size={13} className="opacity-45" />}</button> : flexRender(header.column.columnDef.header, header.getContext())}</th>; })}</tr>)}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => <tr key={row.id} tabIndex={0} className={`scroll-mt-12 cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-[var(--surface-soft-teal)] focus-visible:bg-[var(--surface-soft-teal)] ${row.original.priority === "Emergency" || row.original.overdue ? "border-s-2 border-s-critical" : ""}`} onClick={(event) => { if ((event.target as HTMLElement).closest("a,button")) return; router.push(`/complaints/${row.original.trackingId}`); }} onKeyDown={(event) => { if (event.key === "Enter") router.push(`/complaints/${row.original.trackingId}`); }}>{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 align-top">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-xs text-muted"><span className="font-semibold text-ink tabular-nums">{rows.length}</span> {t(locale, "portal.table.results")} · {t(locale, "portal.pagination.page")} {table.getState().pagination.pageIndex + 1} / {pageCount}</p>
        <div className="flex gap-2"><Button type="button" variant="secondary" className="w-9 px-0" disabled={!table.getCanPreviousPage()} aria-label={t(locale, "portal.pagination.previous")} onClick={() => table.previousPage()}>{locale === "ur" ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</Button><Button type="button" variant="secondary" className="w-9 px-0" disabled={!table.getCanNextPage()} aria-label={t(locale, "portal.pagination.next")} onClick={() => table.nextPage()}>{locale === "ur" ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}</Button></div>
      </div>
    </div>
  );
}
