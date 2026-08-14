import { db } from "@/db";
import { generalLedger, platformSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PaymentTransaction } from "@/db/schema";

export const ACCOUNTS = {
  CASH: "1000",
  BANK: "1100",
  PLATFORM_FEE_REVENUE: "4000",
  PAYMENT_FEES: "5000",
  REFUNDS: "5100",
  OWNER_PAYOUTS: "5200",
} as const;

export type AccountCode = (typeof ACCOUNTS)[keyof typeof ACCOUNTS];

function generateId() {
  return crypto.randomUUID();
}

export async function createPaymentLedgerEntry(payment: PaymentTransaction) {
  const amount = Number(payment.amount);

  const [settings] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.id, "default"))
    .limit(1);

  const platformFeePercent = settings
    ? Number(settings.platformFeePercent) / 100
    : 0.018;
  const platformFee = amount * platformFeePercent;
  const ownerAmount = amount - platformFee;
  const date = payment.paidAt ? new Date(payment.paidAt) : new Date();

  const entries = [
    {
      id: generateId(),
      transactionDate: date,
      accountCode: ACCOUNTS.BANK,
      accountName: "Kas Bank",
      description: `Pembayaran diterima - Invoice ${payment.invoiceNumber}`,
      referenceType: "payment" as const,
      referenceId: payment.id,
      debit: amount.toString(),
      credit: "0",
    },
    {
      id: generateId(),
      transactionDate: date,
      accountCode: ACCOUNTS.PLATFORM_FEE_REVENUE,
      accountName: "Pendapatan Fee Platform",
      description: `Fee platform ${(platformFeePercent * 100).toFixed(1)}% - Invoice ${payment.invoiceNumber}`,
      referenceType: "payment" as const,
      referenceId: payment.id,
      debit: "0",
      credit: platformFee.toFixed(2),
    },
    {
      id: generateId(),
      transactionDate: date,
      accountCode: ACCOUNTS.OWNER_PAYOUTS,
      accountName: "Kewajiban Pembayaran Owner",
      description: `Payout owner - Invoice ${payment.invoiceNumber}`,
      referenceType: "payment" as const,
      referenceId: payment.id,
      debit: "0",
      credit: ownerAmount.toFixed(2),
    },
  ];

  await db.insert(generalLedger).values(entries);
}

export async function createRefundLedgerEntry(refund: {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAt?: string | null;
}) {
  const amount = Number(refund.amount);
  const date = refund.paidAt ? new Date(refund.paidAt) : new Date();

  const entries = [
    {
      id: generateId(),
      transactionDate: date,
      accountCode: ACCOUNTS.REFUNDS,
      accountName: "Pengembalian Dana (Refund)",
      description: `Refund diproses - Invoice ${refund.invoiceNumber}`,
      referenceType: "refund" as const,
      referenceId: refund.id,
      debit: amount.toString(),
      credit: "0",
    },
    {
      id: generateId(),
      transactionDate: date,
      accountCode: ACCOUNTS.BANK,
      accountName: "Kas Bank",
      description: `Refund diproses - Invoice ${refund.invoiceNumber}`,
      referenceType: "refund" as const,
      referenceId: refund.id,
      debit: "0",
      credit: amount.toString(),
    },
  ];

  await db.insert(generalLedger).values(entries);
}

export async function createWithdrawalLedgerEntry(withdrawal: {
  id: string;
  amount: number;
  createdAt: string;
  userId: string;
}) {
  const amount = Number(withdrawal.amount);

  await db.insert(generalLedger).values({
    id: generateId(),
    transactionDate: new Date(withdrawal.createdAt),
    accountCode: ACCOUNTS.OWNER_PAYOUTS,
    accountName: "Kewajiban Pembayaran Owner",
    description: `Withdrawal diproses - ${withdrawal.id}`,
    referenceType: "withdrawal",
    referenceId: withdrawal.id,
    debit: amount.toString(),
    credit: "0",
  });
}

export async function createPlatformFeeLedgerEntry(fee: {
  id: string;
  amount: number;
  createdAt: string;
  description: string;
}) {
  const amount = Number(fee.amount);

  await db.insert(generalLedger).values({
    id: generateId(),
    transactionDate: new Date(fee.createdAt),
    accountCode: ACCOUNTS.PLATFORM_FEE_REVENUE,
    accountName: "Pendapatan Fee Platform",
    description: fee.description,
    referenceType: "fee",
    referenceId: fee.id,
    debit: "0",
    credit: amount.toFixed(2),
  });
}
