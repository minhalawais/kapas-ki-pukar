interface EmptyStateProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="text-sm text-ink">{title}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="mt-3 h-9 rounded-control bg-action px-3 text-sm font-semibold text-[color:var(--on-primary)]"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
