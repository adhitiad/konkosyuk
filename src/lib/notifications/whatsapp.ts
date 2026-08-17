import { getAxiosInstance } from "@/lib/api";
import type { AxiosError } from "axios";
import { getNotificationSettings } from "@/lib/notification-settings";

type WhatsAppTemplateParameter = { type: "text"; text: string };

async function getWhatsAppCredentials() {
  const settings = await getNotificationSettings();
  const phoneNumberId =
    settings.metaPhoneNumberId || process.env.META_PHONE_NUMBER_ID;
  const accessToken = settings.metaAccessToken || process.env.META_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn(
      "WhatsApp credentials belum dikonfigurasi, notifikasi maintenance dilewati",
    );
    return null;
  }

  return { phoneNumberId, accessToken };
}

export async function sendMaintenanceWhatsApp(
  to: string,
  templateName: string,
  parameters: string[],
): Promise<void> {
  const credentials = await getWhatsAppCredentials();
  if (!credentials) return;

  const { phoneNumberId, accessToken } = credentials;
  const formattedPhone = to.replace(/\D/g, "").replace(/^0/, "62");
  try {
    await getAxiosInstance().post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "id" },
          components: [
            {
              type: "body",
              parameters: parameters.map((text): WhatsAppTemplateParameter => ({
                type: "text",
                text,
              })),
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    const axiosError = error as AxiosError<unknown>;
    const response = axiosError.response;
    console.error(
      "WhatsApp maintenance API error:",
      response?.status,
      response?.data ?? error,
    );
  }
}

export async function sendApprovalWhatsApp(
  tenantPhone: string,
  tenantName: string,
  propertyName: string,
  dpAmount: number,
  invoiceUrl: string,
): Promise<void> {
  const credentials = await getWhatsAppCredentials();
  if (!credentials) return;

  const { phoneNumberId, accessToken } = credentials;
  const axios = getAxiosInstance();

  const formattedPhone = tenantPhone.startsWith("0")
    ? `62${tenantPhone.slice(1)}`
    : tenantPhone;

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: "booking_approved",
          language: { code: "id" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: tenantName },
                { type: "text", text: propertyName },
                { type: "text", text: dpAmount.toString() },
                { type: "text", text: invoiceUrl },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    const axiosError = error as AxiosError<unknown>;
    const status = axiosError.response?.status;
    const text = axiosError.response?.data;
    console.error("WhatsApp API error:", status, text);
  }
}
