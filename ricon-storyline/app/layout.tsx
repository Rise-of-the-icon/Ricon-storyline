import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { AppMotionProvider } from "@/components/providers/AppMotionProvider";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RICON Storyline",
  description: "RICON Storyline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${dmSans.variable} h-full bg-ink antialiased`}
    >
      <body className="min-h-dvh overflow-x-hidden bg-ink text-paper">
        <AppMotionProvider>{children}</AppMotionProvider>
        <div className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.03] mix-blend-screen">
          <svg
            className="h-full w-full"
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio="none"
          >
            <filter id="ricon-film-grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="4"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#ricon-film-grain)" />
          </svg>
        </div>
      </body>
    </html>
  );
}
