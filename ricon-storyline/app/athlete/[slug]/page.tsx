import { notFound } from "next/navigation";

import { AthleteHomeClient } from "./AthleteHomeClient";
import { david } from "@/data/david";
import type { Athlete } from "@/data/types";

const athletes: Athlete[] = [david];

export function generateStaticParams() {
  return athletes.map((athlete) => ({
    slug: athlete.slug,
  }));
}

export default async function AthleteHomePage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const athlete = athletes.find((item) => item.slug === slug);

  if (!athlete) {
    notFound();
  }

  return <AthleteHomeClient athlete={athlete} />;
}
