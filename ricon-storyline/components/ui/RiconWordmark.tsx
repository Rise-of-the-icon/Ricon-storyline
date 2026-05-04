import { cn } from "@/lib/utils";

export function RiconWordmark({
  showSubtitle = true,
  className,
}: Readonly<{
  showSubtitle?: boolean;
  className?: string;
}>) {
  return (
    <div className={cn("inline-flex flex-col items-start", className)}>
      <span className="font-display text-[28px] leading-none tracking-[0.18em] text-white">
        RICON
      </span>
      {showSubtitle ? (
        <span className="mt-1 font-body text-[10px] leading-3 text-paper/45">
          Rise of the Icon
        </span>
      ) : null}
    </div>
  );
}
