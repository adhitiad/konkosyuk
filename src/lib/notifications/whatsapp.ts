import { getAxiosInstance } from "@/lib/api";
import type { AxiosError } from "axios";

type WhatsAppTemplateParameter = { type: "text"; text: string };

export async function sendMaintenanceWhatsApp(
  to: string,
  templateName: string,
  parameters: string[],
): Promise<void> {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    console.warn(
      "WhatsApp credentials belum dikonfigurasi, notifikasi maintenance dilewati",
    );
    return;
  }
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
  try {
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const axios = getAxiosInstance();

    if (!phoneNumberId || !accessToken) {
      console.warn(
        "WhatsApp credentials not configured, skipping WhatsApp notification",
      );
      return;
    }

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
  } catch (error) {
    console.error("Failed to send approval WhatsApp:", error);
  }
}
