"use client";

import type { MouseEventHandler } from "react";

import { cn } from "@/lib/utils";

export function VerifiedBadge({
  onTap,
  className,
}: Readonly<{
  onTap?: () => void;
  className?: string;
}>) {
  const handleTap: MouseEventHandler<HTMLButtonElement> = () => {
    onTap?.();
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan/20 bg-paper/[0.06] px-3.5 text-[10px] font-medium uppercase tracking-[0.18em] text-paper/85 backdrop-blur-md",
        "font-mono transition-colors duration-200 active:bg-paper/[0.1]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan",
        className,
      )}
      aria-label="Verified"
    >
      <span
        className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_12px_rgba(0,180,216,0.75)] motion-safe:animate-verified-pulse"
        aria-hidden="true"
      />
      <span>Verified</span>
    </button>
  );
}
