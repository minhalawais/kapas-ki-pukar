interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-4" role="status">
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
