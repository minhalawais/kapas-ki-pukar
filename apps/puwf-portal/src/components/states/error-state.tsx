interface ErrorStateProps {
  title: string;
  retryLabel: string;
  onRetry: () => void;
}

export function ErrorState({ title, retryLabel, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="text-sm text-ink">{title}</p>
      <button
        type="button"
        className="mt-3 h-9 rounded-control bg-action px-3 text-sm font-semibold text-[color:var(--on-primary)]"
        onClick={onRetry}
      >
        {retryLabel}
      </button>
    </div>
  );
}
