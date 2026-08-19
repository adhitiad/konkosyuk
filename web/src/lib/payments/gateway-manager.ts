import type { PaymentGatewayConfig } from "@/db/schema";
import { getAxiosInstance } from "@/lib/api";
import { decryptPaymentConfig } from "@/lib/payment-config-crypto";
import type { AxiosError } from "axios";

export type GatewayProvider = "doku" | "ipaymu" | "nicepay";

export interface GatewayConfig {
  clientId?: string;
  secretKey?: string;
  webhookSecret?: string;
  merchantCode?: string;
  baseUrl?: string;
}

export interface PaymentRequest {
  invoiceNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemDetails: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  message?: string;
  rawResponse?: Record<string, unknown>;
}

interface DokuCreateResponse {
  transactionId: string;
  paymentUrl: string;
}

interface IpaymuCreateResponse {
  status: string;
  data: {
    transactionId: string;
    paymentUrl: string;
  };
}

interface NicepayCreateResponse {
  transactionId: string;
  paymentUrl: string;
}

interface DokuStatusResponse {
  status: string;
}

interface IpaymuStatusResponse {
  status: string;
  data: {
    status: string;
  };
}

interface NicepayStatusResponse {
  status: string;
}

interface DokuRefundResponse {
  message: string;
}

interface IpaymuRefundResponse {
  status: string;
  message: string;
}

interface NicepayRefundResponse {
  message: string;
}

export class PaymentGatewayError extends Error {
  constructor(
    public provider: GatewayProvider,
    message: string,
    public statusCode?: number,
    public response?: Record<string, unknown>,
  ) {
    super(`[${provider}] ${message}`);
    this.name = "PaymentGatewayError";
  }
}

function resolveConfig(config: PaymentGatewayConfig): GatewayConfig {
  const values = decryptPaymentConfig(config.config);
  return {
    clientId: (values.clientId as string | undefined) ?? undefined,
    secretKey: (values.secretKey as string | undefined) ?? undefined,
    webhookSecret: (values.webhookSecret as string | undefined) ?? undefined,
    merchantCode: (values.merchantCode as string | undefined) ?? undefined,
    baseUrl: (values.baseUrl as string | undefined) ?? undefined,
  };
}

export class PaymentGatewayManager {
  private static instance: PaymentGatewayManager;
  private configs: Map<GatewayProvider, GatewayConfig> = new Map();

  private constructor() {}

  static getInstance(): PaymentGatewayManager {
    if (!PaymentGatewayManager.instance) {
      PaymentGatewayManager.instance = new PaymentGatewayManager();
    }
    return PaymentGatewayManager.instance;
  }

  loadConfig(config: PaymentGatewayConfig) {
    this.configs.set(config.provider as GatewayProvider, resolveConfig(config));
  }

  getConfig(provider: GatewayProvider): GatewayConfig | undefined {
    return this.configs.get(provider);
  }

  getAllConfigs(): GatewayConfig[] {
    return Array.from(this.configs.values());
  }

  isConfigured(provider: GatewayProvider): boolean {
    const config = this.configs.get(provider);
    return !!config?.clientId && !!config?.secretKey;
  }

  getActiveProvider(): GatewayProvider | null {
    for (const [provider, config] of this.configs.entries()) {
      if (config.clientId && config.secretKey) {
        return provider;
      }
    }
    return null;
  }

  validateConfig(provider: GatewayProvider): boolean {
    const config = this.configs.get(provider);
    if (!config) {
      throw new PaymentGatewayError(provider, "Configuration not found");
    }

    const requiredFields = ["clientId", "secretKey", "merchantCode"] as const;
    const missingFields = requiredFields.filter((field) => !config[field]);

    if (missingFields.length > 0) {
      throw new PaymentGatewayError(
        provider,
        `Missing required fields: ${missingFields.join(", ")}`,
      );
    }

    return true;
  }

  async createPayment(
    provider: GatewayProvider,
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    this.validateConfig(provider);

    switch (provider) {
      case "doku":
        return this.createDokuPayment(request);
      case "ipaymu":
        return this.createIpaymuPayment(request);
      case "nicepay":
        return this.createNicepayPayment(request);
      default:
        throw new PaymentGatewayError(provider, "Unsupported payment provider");
    }
  }

  async checkStatus(
    provider: GatewayProvider,
    transactionId: string,
  ): Promise<PaymentResponse> {
    this.validateConfig(provider);

    switch (provider) {
      case "doku":
        return this.checkDokuStatus(transactionId);
      case "ipaymu":
        return this.checkIpaymuStatus(transactionId);
      case "nicepay":
        return this.checkNicepayStatus(transactionId);
      default:
        throw new PaymentGatewayError(provider, "Unsupported payment provider");
    }
  }

  async processRefund(
    provider: GatewayProvider,
    transactionId: string,
    amount?: number,
    reason?: string,
  ): Promise<PaymentResponse> {
    this.validateConfig(provider);

    switch (provider) {
      case "doku":
        return this.refundDoku(transactionId, amount, reason);
      case "ipaymu":
        return this.refundIpaymu(transactionId, amount, reason);
      case "nicepay":
        return this.refundNicepay(transactionId, amount, reason);
      default:
        throw new PaymentGatewayError(provider, "Unsupported payment provider");
    }
  }

  private async createDokuPayment(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    const config = this.configs.get("doku")!;
    const baseUrl = config.baseUrl || "https://api.doku.com";
    const axios = getAxiosInstance();

    try {
      const { data } = await axios.post<
        DokuCreateResponse & { message?: string }
      >(
        `${baseUrl}/api/v1/payment/create`,
        {
          clientId: config.clientId,
          invoiceNumber: request.invoiceNumber,
          amount: request.amount,
          currency: "IDR",
          customer: {
            name: request.customerName,
            email: request.customerEmail,
            phone: request.customerPhone,
          },
          items: request.itemDetails,
          returnUrl: request.returnUrl,
          cancelUrl: request.cancelUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
          },
        },
      );

      return {
        success: true,
        transactionId: data.transactionId,
        paymentUrl: data.paymentUrl,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      const axiosError = error as AxiosError<Record<string, unknown>>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      throw new PaymentGatewayError("doku", message, status, responseData);
    }
  }

  private async createIpaymuPayment(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    const config = this.configs.get("ipaymu")!;
    const baseUrl = config.baseUrl || "https://api.ipaymu.com/api/v2";
    const axios = getAxiosInstance();

    try {
      const { data } = await axios.post<
        IpaymuCreateResponse & { message?: string }
      >(
        `${baseUrl}/transaction`,
        {
          clientId: config.clientId,
          merchantCode: config.merchantCode,
          invoiceNumber: request.invoiceNumber,
          amount: request.amount,
          currency: "IDR",
          customer: {
            name: request.customerName,
            email: request.customerEmail,
            phone: request.customerPhone,
          },
          items: request.itemDetails,
          returnUrl: request.returnUrl,
          cancelUrl: request.cancelUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
          },
        },
      );

      if (data.status !== "success") {
        throw new PaymentGatewayError(
          "ipaymu",
          data.message || "Payment creation failed",
          undefined,
          data as unknown as Record<string, unknown>,
        );
      }

      return {
        success: true,
        transactionId: data.data?.transactionId,
        paymentUrl: data.data?.paymentUrl,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      const axiosError = error as AxiosError<Record<string, unknown>>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      throw new PaymentGatewayError("ipaymu", message, status, responseData);
    }
  }

  private async createNicepayPayment(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    const config = this.configs.get("nicepay")!;
    const baseUrl = config.baseUrl || "https://api.nicepay.co.id";
    const axios = getAxiosInstance();

    try {
      const { data } = await axios.post<
        NicepayCreateResponse & { message?: string }
      >(
        `${baseUrl}/api/v1/payment/create`,
        {
          clientId: config.clientId,
          merchantCode: config.merchantCode,
          invoiceNumber: request.invoiceNumber,
          amount: request.amount,
          currency: "IDR",
          customer: {
            name: request.customerName,
            email: request.customerEmail,
            phone: request.customerPhone,
          },
          items: request.itemDetails,
          returnUrl: request.returnUrl,
          cancelUrl: request.cancelUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
          },
        },
      );

      return {
        success: true,
        transactionId: data.transactionId,
        paymentUrl: data.paymentUrl,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      const axiosError = error as AxiosError<Record<string, unknown>>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      throw new PaymentGatewayError("nicepay", message, status, responseData);
    }
  }

  private async checkDokuStatus(
    transactionId: string,
  ): Promise<PaymentResponse> {
    const config = this.configs.get("doku")!;
    const baseUrl = config.baseUrl || "https://api.doku.com";
    const axios = getAxiosInstance();

    try {
      const { data } = await axios.get<
        DokuStatusResponse & { message?: string }
      >(
        `${baseUrl}/api/v1/payment/status/${encodeURIComponent(transactionId)}`,
        {
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
          },
        },
      );

      return {
        success: data.status === "success",
        transactionId,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      const axiosError = error as AxiosError<Record<string, unknown>>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      throw new PaymentGatewayError("doku", message, status, responseData);
    }
  }

  private async checkIpaymuStatus(
    transactionId: string,
  ): Promise<PaymentResponse> {
    const config = this.configs.get("ipaymu")!;
    const baseUrl = config.baseUrl || "https://api.ipaymu.com/api/v2";
    const axios = getAxiosInstance();

    try {
      const { data } = await axios.get<
        IpaymuStatusResponse & { message?: string }
      >(`${baseUrl}/transaction/${encodeURIComponent(transactionId)}`, {
        headers: {
          Authorization: `Bearer ${config.secretKey}`,
        },
      });

      if (data.status !== "success") {
        throw new PaymentGatewayError(
          "ipaymu",
          data.message || "Status check failed",
          undefined,
          data as unknown as Record<string, unknown>,
        );
      }

      return {
        success: data.data?.status === "success",
        transactionId,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      const axiosError = error as AxiosError<Record<string, unknown>>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      throw new PaymentGatewayError("ipaymu", message, status, responseData);
    }
  }

  private async checkNicepayStatus(
    transactionId: string,
  ): Promise<PaymentResponse> {
    const config = this.configs.get("nicepay")!;
    const baseUrl = config.baseUrl || "https://api.nicepay.co.id";
    const axios = getAxiosInstance();

    try {
      const { data } = await axios.get<
        NicepayStatusResponse & { message?: string }
      >(
        `${baseUrl}/api/v1/payment/status/${encodeURIComponent(transactionId)}`,
        {
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
          },
        },
      );

      return {
        success: data.status === "success",
        transactionId,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      const axiosError = error as AxiosError<Record<string, unknown>>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      throw new PaymentGatewayError("nicepay", message, status, responseData);
    }
  }

  private async refundDoku(
    transactionId: string,
    amount?: number,
    reason?: string,
  ): Promise<PaymentResponse> {
    const config = this.configs.get("doku")!;
    const baseUrl = config.baseUrl || "https://api.doku.com";
    const axios = getAxiosInstance();

    try {
      const { data } = await axios.post<
        DokuRefundResponse & { message?: string }
      >(
        `${baseUrl}/api/v1/payment/refund`,
        {
          transactionId,
          amount,
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
          },
        },
      );

      return {
        success: true,
        transactionId,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      const axiosError = error as AxiosError<Record<string, unknown>>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      throw new PaymentGatewayError("doku", message, status, responseData);
    }
  }

  private async refundIpaymu(
    transactionId: string,
    amount?: number,
    reason?: string,
  ): Promise<PaymentResponse> {
    const config = this.configs.get("ipaymu")!;
    const baseUrl = config.baseUrl || "https://api.ipaymu.com/api/v2";
    const axios = getAxiosInstance();

    try {
      const { data } = await axios.post<
        IpaymuRefundResponse & { message?: string }
      >(
        `${baseUrl}/transaction/refund`,
        {
          transactionId,
          amount,
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
          },
        },
      );

      if (data.status !== "success") {
        throw new PaymentGatewayError(
          "ipaymu",
          data.message || "Refund failed",
          undefined,
          data as unknown as Record<string, unknown>,
        );
      }

      return {
        success: true,
        transactionId,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      const axiosError = error as AxiosError<Record<string, unknown>>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      throw new PaymentGatewayError("ipaymu", message, status, responseData);
    }
  }

  private async refundNicepay(
    transactionId: string,
    amount?: number,
    reason?: string,
  ): Promise<PaymentResponse> {
    const config = this.configs.get("nicepay")!;
    const baseUrl = config.baseUrl || "https://api.nicepay.co.id";
    const axios = getAxiosInstance();

    try {
      const { data } = await axios.post<
        NicepayRefundResponse & { message?: string }
      >(
        `${baseUrl}/api/v1/payment/refund`,
        {
          transactionId,
          amount,
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${config.secretKey}`,
          },
        },
      );

      return {
        success: true,
        transactionId,
        rawResponse: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Unknown error";
      const axiosError = error as AxiosError<Record<string, unknown>>;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      throw new PaymentGatewayError("nicepay", message, status, responseData);
    }
  }
}

export const paymentGatewayManager = PaymentGatewayManager.getInstance();
