import { Resend } from "resend";
import { getNotificationSettings } from "@/lib/notification-client";
import { logInfo } from "@/lib/logger";

export async function getResendClient() {
  const settings = await getNotificationSettings();
  const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) {
    logInfo("RESEND_API_KEY belum dikonfigurasi, email maintenance dilewati");
    return null;
  }
  return new Resend(apiKey);
}

export async function getFromEmail() {
  const settings = await getNotificationSettings();
  return (
    settings.resendFromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    "KonkosYuk <onboarding@resend.dev>"
  );
}