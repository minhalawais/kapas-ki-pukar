"use client";

import type { CaseAction, CaseStatus } from "@kapas/domain";
import {
  simplifiedProgressStages,
  simplifiedStageCompletion,
  simplifiedStageIndex,
} from "@kapas/domain";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const stepperColsClass: Record<number, string> = {
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

export function CaseStageStepper({
  status,
  actions,
}: {
  status: CaseStatus;
  actions: CaseAction[];
}) {
  const stages = simplifiedProgressStages(actions);
  const done = simplifiedStageCompletion(actions, status);
  const current = simplifiedStageIndex(actions, status);

  return (
    <div className="rounded-card border border-border bg-surface p-4" aria-label="Complaint lifecycle">
      <ol className={cn("grid gap-2 grid-cols-2 sm:grid-cols-3", stepperColsClass[stages.length] ?? "md:grid-cols-4")}>
        {stages.map((stage, index) => {
          const complete = done[index] || status === "Closed";
          const isCurrent = index === current && status !== "Closed";
          return (
            <li key={stage.kind} className="flex items-center gap-2 md:block">
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full border text-xs font-bold",
                  complete && "border-success bg-success text-white",
                  isCurrent && "border-[var(--brand-fos-teal-dark)] bg-[var(--surface-soft-teal)] text-[var(--brand-fos-teal-dark)]",
                  !complete && !isCurrent && "border-border text-muted",
                )}
              >
                {complete ? <Check size={14} aria-hidden /> : index + 1}
              </span>
              <span className={cn("text-xs md:mt-2 md:block", isCurrent ? "font-semibold text-ink" : "text-muted")}>
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
