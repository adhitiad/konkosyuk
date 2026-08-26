/** Processor untuk prediksi churn user dan owner. */
import { Job } from "bullmq";

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { logInfo, logError } from "@konkosyuk/shared/lib/logger";
import * as Sentry from "@sentry/node";

export interface ChurnPredictionResult {
  processed: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  errors: number;
}

export async function processChurnPrediction(job: Job): Promise<ChurnPredictionResult> {
  logInfo("Job churn-prediction dimulai", { jobId: job.id });

  const result: ChurnPredictionResult = {
    processed: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    errors: 0,
  };

  try {
    const dbResult = await db.execute(sql`
      WITH user_activity AS (
        SELECT
          u.id as user_id,
          u.role,
          u.email,
          u.name,
          MAX(ae.created_at) as last_activity_at,
          COUNT(DISTINCT CASE WHEN ae.event = 'search_performed' AND ae.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as searches_30d,
          COUNT(DISTINCT CASE WHEN ae.event = 'property_viewed' AND ae.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as views_30d,
          COUNT(DISTINCT CASE WHEN ae.event = 'booking_initiated' AND ae.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as inquiries_30d,
          COUNT(DISTINCT CASE WHEN ae.event = 'payment_completed' AND ae.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as bookings_30d
        FROM users u
        LEFT JOIN analytics_events ae ON u.id = ae.user_id
        WHERE u.role IN ('cust', 'owner')
          AND u.deleted_at IS NULL
        GROUP BY u.id, u.role, u.email, u.name
      )
      SELECT * FROM user_activity
      WHERE (
        CASE 
          WHEN last_activity_at IS NULL THEN 40
          WHEN EXTRACT(DAYS FROM NOW() - last_activity_at) > 30 THEN 40
          WHEN EXTRACT(DAYS FROM NOW() - last_activity_at) > 14 THEN 35
          WHEN EXTRACT(DAYS FROM NOW() - last_activity_at) > 7 THEN 20
          ELSE 0
        END +
        CASE WHEN searches_30d = 0 THEN 30 ELSE 0 END +
        CASE WHEN views_30d = 0 THEN 20 ELSE 0 END +
        CASE WHEN inquiries_30d = 0 THEN 20 ELSE 0 END +
        CASE WHEN bookings_30d > 0 THEN -20 ELSE 0 END
      ) >= 30
    `);

    const usersAtRisk = dbResult.rows as Array<{
      user_id: string;
      role: string;
      email: string | null;
      name: string | null;
      churn_score: number | null;
    }>;

    for (const user of usersAtRisk) {
      result.processed++;
      const score = Number(user.churn_score || 0);

      if (score >= 60) {
        result.highRisk++;
        await sendReEngagement({
          user_id: user.user_id,
          role: user.role,
          email: user.email,
          name: user.name,
        });
      } else if (score >= 30) {
        result.mediumRisk++;
        await sendReEngagement({
          user_id: user.user_id,
          role: user.role,
          email: user.email,
          name: user.name,
        });
      } else {
        result.lowRisk++;
      }
    }

    logInfo("Job churn-prediction selesai", {
      jobId: job.id,
      ...result,
    });

    return result;
  } catch (error) {
    logError(error, "Job churn-prediction gagal", { jobId: job.id });
    Sentry.captureException(error, {
      tags: { queue: "churn-prediction", jobId: job.id ?? undefined },
    });
    throw error;
  }
}

async function sendReEngagement(user: {
  user_id: string;
  role: string;
  email: string | null;
  name: string | null;
}) {
  try {
    if (user.role === "owner" && user.email) {
      await sendOwnerReEngagementEmail(user.email, user.name);
    } else if (user.email) {
      await sendTenantReEngagementEmail(user.email, user.name);
    }
  } catch (error) {
    logError(error, "Gagal mengirim re-engagement", {
      userId: user.user_id,
      email: user.email,
    });
  }
}

async function sendTenantReEngagementEmail(
  email: string,
  name: string | null,
) {
  const { sendReEngagementEmail } = await import("@/lib/notifications/email");
  await sendReEngagementEmail(email, name);
}

async function sendOwnerReEngagementEmail(
  email: string,
  name: string | null,
) {
  const { sendReEngagementEmail } = await import("@/lib/notifications/email");
  await sendReEngagementEmail(email, name, true);
}
