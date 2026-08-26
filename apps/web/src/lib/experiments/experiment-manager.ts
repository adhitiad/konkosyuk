import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { experiments, experimentAssignments } from "@/db/schema";
import { createHash } from "crypto";

export interface ExperimentVariant {
  name: string;
  weight: number;
  config: Record<string, unknown>;
}

export interface Experiment {
  id: string;
  name: string;
  status: "draft" | "running" | "completed";
  variants: ExperimentVariant[];
  metrics: Array<{ name: string; primary?: boolean }>;
  startDate?: Date;
  endDate?: Date;
}

export async function getExperiment(
  experimentId: string,
): Promise<Experiment | null> {
  const row = await db.query.experiments.findFirst({
    where: eq(experiments.id, experimentId),
  });

  if (!row || row.status !== "running") return null;

  return {
    id: row.id,
    name: row.name,
    status: row.status as Experiment["status"],
    variants: row.variants as ExperimentVariant[],
    metrics: row.metrics as Experiment["metrics"],
    startDate: row.startDate ?? undefined,
    endDate: row.endDate ?? undefined,
  };
}

export async function assignVariant(
  userId: string,
  experimentId: string,
): Promise<string | null> {
  const experiment = await getExperiment(experimentId);
  if (!experiment) return null;

  const existing = await db.query.experimentAssignments.findFirst({
    where: and(
      eq(experimentAssignments.userId, userId),
      eq(experimentAssignments.experimentId, experimentId),
    ),
  });

  if (existing) return existing.variant;

  const variant = calculateVariant(userId, experimentId, experiment.variants);

  await db.insert(experimentAssignments).values({
    userId,
    experimentId,
    variant,
  });

  return variant;
}

export function calculateVariant(
  userId: string,
  experimentId: string,
  variants: ExperimentVariant[],
): string {
  const hash = createHash("sha256")
    .update(`${userId}:${experimentId}`)
    .digest("hex");

  const bucket = parseInt(hash.slice(0, 8), 16) / 0xffffffff;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant.name;
  }

  return variants[0]?.name ?? "control";
}

export async function trackExperimentEvent(
  userId: string,
  experimentId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: `experiment_${event}`,
        properties: {
          ...properties,
          experimentId,
          userId,
        },
      }),
    });
  } catch {
    // Silently fail - experiment tracking should not break the app
  }
}
