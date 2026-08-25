import { ipaymuAdapter } from "./ipaymu";
import { dokuAdapter } from "./doku";
import { nicepayAdapter } from "./nicepay";
import { mockAdapter } from "./mock";
import type { PaymentProviderAdapter, PaymentProviderName } from "./types";
import { env } from "@/lib/env";

const isMockMode = env.PAYMENT_MODE === "mock";

if (isMockMode && process.env.NODE_ENV === "production") {
  throw new Error(
    "PAYMENT_MODE tidak boleh 'mock' di production. Set PAYMENT_MODE=live.",
  );
}

const providers: Record<PaymentProviderName, PaymentProviderAdapter> = {
  ipaymu: isMockMode ? mockAdapter : ipaymuAdapter,
  doku: isMockMode ? mockAdapter : dokuAdapter,
  nicepay: isMockMode ? mockAdapter : nicepayAdapter,
  mock: mockAdapter,
};

export function getPaymentProvider(
  name: string,
): PaymentProviderAdapter | null {
  if (isPaymentProviderName(name)) {
    return providers[name];
  }
  return null;
}

export function isPaymentProviderName(
  value: string,
): value is PaymentProviderName {
  return value === "ipaymu" || value === "doku" || value === "nicepay";
}
