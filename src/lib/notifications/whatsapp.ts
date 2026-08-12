import { getAxiosInstance } from '@/lib/api'

export async function sendApprovalWhatsApp(
  tenantPhone: string,
  tenantName: string,
  propertyName: string,
  dpAmount: number,
  invoiceUrl: string,
): Promise<void> {
  try {
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID
    const accessToken = process.env.META_ACCESS_TOKEN
    const axios = getAxiosInstance()

    if (!phoneNumberId || !accessToken) {
      console.warn('WhatsApp credentials not configured, skipping WhatsApp notification')
      return
    }

    const formattedPhone = tenantPhone.startsWith('0')
      ? `62${tenantPhone.slice(1)}`
      : tenantPhone

    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: 'booking_approved',
            language: { code: 'id' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: tenantName },
                  { type: 'text', text: propertyName },
                  { type: 'text', text: dpAmount.toString() },
                  { type: 'text', text: invoiceUrl },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      )
    } catch (error) {
      const status = (error as any)?.response?.status
      const text = (error as any)?.response?.data
      console.error('WhatsApp API error:', status, text)
    }
  } catch (error) {
    console.error('Failed to send approval WhatsApp:', error)
  }
}
