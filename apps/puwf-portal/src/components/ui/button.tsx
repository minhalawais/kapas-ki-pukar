"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-control text-sm font-semibold transition-colors duration-fast ease-standard disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "h-9 bg-action px-3 text-[color:var(--on-primary)] hover:bg-[var(--brand-puwf-emerald)]",
        secondary: "h-9 border border-border bg-surface px-3 text-ink hover:bg-page",
        ghost: "h-9 px-3 text-ink hover:bg-page",
        destructive: "h-9 bg-critical px-3 text-[color:var(--on-primary)] hover:brightness-95",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
