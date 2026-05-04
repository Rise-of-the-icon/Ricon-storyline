"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function AppMotionProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={pathname} className="min-h-dvh">
        {children}
      </div>
    </AnimatePresence>
  );
}
