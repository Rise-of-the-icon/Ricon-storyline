import { notFound } from "next/navigation";

import { TimelineClient } from "./TimelineClient";
import { david } from "@/data/david";
import type { Athlete } from "@/data/types";

const athletes: Athlete[] = [david];

export function generateStaticParams() {
  return athletes.map((athlete) => ({
    slug: athlete.slug,
  }));
}

export default async function TimelinePage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const athlete = athletes.find((item) => item.slug === slug);

  if (!athlete) {
    notFound();
  }

  return <TimelineClient athlete={athlete} />;
}
