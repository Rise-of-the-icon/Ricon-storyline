import { notFound } from "next/navigation";

import { StoryClient } from "./StoryClient";
import { collectibles } from "@/data/collectibles";
import { david } from "@/data/david";
import type { Athlete } from "@/data/types";

const athletes: Athlete[] = [david];

export function generateStaticParams() {
  return athletes.flatMap((athlete) =>
    athlete.moments.map((moment) => ({
      slug: athlete.slug,
      momentId: moment.id,
    })),
  );
}

export default async function StoryPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string; momentId: string }>;
}>) {
  const { slug, momentId } = await params;
  const athlete = athletes.find((item) => item.slug === slug);
  const moment = athlete?.moments.find((item) => item.id === momentId);

  if (!athlete || !moment) {
    notFound();
  }

  const collectible = collectibles.find((item) => item.momentId === moment.id);

  return (
    <StoryClient athlete={athlete} moment={moment} collectible={collectible} />
  );
}
