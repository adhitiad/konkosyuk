import { NextRequest } from "next/server";
import { logSecurityEvent } from "./logger";

const ALLOWED_WEBHOOK_IPS: Record<string, string[]> = {
  doku: ["103.28.36.0/24", "103.28.37.0/24", "103.28.38.0/24"],
  ipaymu: ["103.28.36.0/24", "103.28.37.0/24"],
  nicepay: ["103.28.36.0/24", "103.28.37.0/24", "103.28.38.0/24"],
};

function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return -1;
  }
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function cidrRange(network: string): { start: number; end: number } {
  const [prefix, lengthStr] = network.split("/");
  const length = parseInt(lengthStr || "32", 10);
  const ipNum = ipToNumber(prefix);
  if (ipNum === -1) {
    return { start: -1, end: -1 };
  }
  const mask = length === 0 ? 0 : (~0 << (32 - length)) >>> 0;
  const start = (ipNum & mask) >>> 0;
  const end = (start | (~mask >>> 0)) >>> 0;
  return { start, end };
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const ipNum = ipToNumber(ip);
  if (ipNum === -1) return false;
  const { start, end } = cidrRange(cidr);
  return ipNum >= start && ipNum <= end;
}

export function isWebhookIpAllowed(
  provider: string,
  req: NextRequest,
): boolean {
  const allowedIps = ALLOWED_WEBHOOK_IPS[provider];
  if (!allowedIps || allowedIps.length === 0) {
    logSecurityEvent("webhook_ip_config_missing", { provider });
    return false;
  }

  const clientIp = getTrustedClientIp(req);

  if (!clientIp) {
    return false;
  }

  return allowedIps.some((cidr) => isIpInCidr(clientIp, cidr));
}

export function getClientIp(req: NextRequest): string {
  return getTrustedClientIp(req);
}

function getTrustedClientIp(req: NextRequest): string {
  const vercelIp = req.headers.get("x-vercel-ip");
  if (vercelIp) {
    return vercelIp.split(",")[0].trim();
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const isVercel = req.headers.get("x-vercel-forwarded-for") !== null || req.headers.get("x-vercel-ip") !== null;
  
  if (isVercel && forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return "unknown";
}
