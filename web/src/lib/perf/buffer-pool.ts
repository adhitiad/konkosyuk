/**
 * Buffer Pool & TypedArray utilities — Efisiensi alokasi memori.
 *
 * Menghindari pembuatan Buffer/ArrayBuffer baru berulang kali dengan
 * menyediakan pool of pre-allocated buffers yang bisa di-reuse.
 */

import { timingSafeEqual } from "node:crypto";

// ---------------------------------------------------------------------------
// Shared TextEncoder / TextDecoder (singleton, bukan per-request)
// ---------------------------------------------------------------------------

/** Shared TextEncoder singleton — thread-safe di V8 single-threaded runtime */
export const sharedEncoder = new TextEncoder();

/** Shared TextDecoder singleton */
export const sharedDecoder = new TextDecoder();

// ---------------------------------------------------------------------------
// Buffer Pool — reusable ArrayBuffer dengan bucket sizing
// ---------------------------------------------------------------------------

/** Ukuran bucket yang tersedia (dalam bytes) */
const BUCKET_SIZES = [256, 1024, 4096, 16384, 65536] as const;
type BucketSize = (typeof BUCKET_SIZES)[number];

const pools = new Map<BucketSize, ArrayBuffer[]>();
const MAX_POOL_PER_BUCKET = 16;

// Inisialisasi pools
for (const size of BUCKET_SIZES) {
  pools.set(size, []);
}

/** Cari bucket size terkecil yang cukup untuk `needed` bytes */
function findBucket(needed: number): BucketSize | null {
  for (const size of BUCKET_SIZES) {
    if (size >= needed) return size;
  }
  return null;
}

/**
 * Ambil ArrayBuffer dari pool. Jika tidak ada yang cocok,
 * alokasi baru.
 *
 * @param minBytes - Minimum ukuran buffer yang dibutuhkan
 * @returns ArrayBuffer yang setidaknya sebesar `minBytes`
 */
export function acquireBuffer(minBytes: number): ArrayBuffer {
  const bucket = findBucket(minBytes);
  if (bucket !== null) {
    const pool = pools.get(bucket)!;
    const buf = pool.pop();
    if (buf) return buf;
    return new ArrayBuffer(bucket);
  }
  // Lebih besar dari bucket terbesar → alokasi langsung
  return new ArrayBuffer(minBytes);
}

/**
 * Kembalikan ArrayBuffer ke pool agar bisa di-reuse.
 * Hanya buffer dengan ukuran yang cocok bucket yang di-pool.
 */
export function releaseBuffer(buf: ArrayBuffer): void {
  const size = buf.byteLength as BucketSize;
  const pool = pools.get(size);
  if (pool && pool.length < MAX_POOL_PER_BUCKET) {
    pool.push(buf);
  }
  // else: let GC collect it
}

/** Statistik pool untuk monitoring */
export function getBufferPoolStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const [size, pool] of pools) {
    stats[`bucket_${size}B`] = pool.length;
  }
  return stats;
}

// ---------------------------------------------------------------------------
// SSE Encoder — encode SSE events langsung ke Uint8Array
// ---------------------------------------------------------------------------

/**
 * Encode SSE (Server-Sent Events) message langsung ke Uint8Array
 * tanpa intermediate string concatenation.
 */
export function encodeSSE(
  id: string,
  event: string,
  data: unknown,
): Uint8Array {
  // Format: "id: {id}\nevent: {event}\ndata: {json}\n\n"
  const jsonData = JSON.stringify(data);
  const message = `id: ${id}\nevent: ${event}\ndata: ${jsonData}\n\n`;
  return sharedEncoder.encode(message);
}

/** Encode SSE comment (ping) */
export function encodeSSEPing(): Uint8Array {
  return SSE_PING_BYTES;
}

// Pre-encoded ping bytes (immutable, shared di semua connections)
const SSE_PING_BYTES = sharedEncoder.encode(": ping\n\n");

// ---------------------------------------------------------------------------
// CSV Buffer — build CSV menggunakan TypedArray
// ---------------------------------------------------------------------------

/**
 * Build CSV content menggunakan ArrayBuffer alih-alih string concatenation.
 * Lebih efisien untuk dataset besar karena menghindari banyak
 * intermediate string allocations.
 */
export class CsvBuffer {
  private chunks: Uint8Array[] = [];
  private totalBytes = 0;

  /** Tambahkan satu baris CSV (sudah di-format) */
  appendLine(line: string): void {
    const encoded = sharedEncoder.encode(line + "\n");
    this.chunks.push(encoded);
    this.totalBytes += encoded.byteLength;
  }

  /** Gabungkan semua chunks menjadi satu Uint8Array */
  toUint8Array(): Uint8Array {
    const result = new Uint8Array(this.totalBytes);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }

  /** Buat Blob dari buffer */
  toBlob(): Blob {
    const u8 = this.toUint8Array();
    return new Blob([u8.buffer as ArrayBuffer], {
      type: "text/csv;charset=utf-8;",
    });
  }

  /** Jumlah bytes yang sudah di-buffer */
  get byteLength(): number {
    return this.totalBytes;
  }

  /** Reset buffer untuk reuse */
  reset(): void {
    this.chunks.length = 0;
    this.totalBytes = 0;
  }
}

// ---------------------------------------------------------------------------
// Signature Buffer — reuse Buffer untuk crypto operations
// ---------------------------------------------------------------------------

/**
 * Pre-allocated buffer pair untuk timingSafeEqual.
 * Menghindari Buffer.from() per-call pada signature verification.
 */
const SIG_BUFFER_SIZE = 256; // Cukup untuk hex SHA-256 (64 chars) dan sebagian besar signatures
let sigBufA: Buffer | null = null;
let sigBufB: Buffer | null = null;

/**
 * Bandingkan dua string secara timing-safe menggunakan pre-allocated buffers.
 * Fallback ke Buffer.from() jika string terlalu panjang.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  // Untuk string pendek, gunakan pre-allocated buffers
  if (a.length <= SIG_BUFFER_SIZE) {
    if (!sigBufA) sigBufA = Buffer.alloc(SIG_BUFFER_SIZE);
    if (!sigBufB) sigBufB = Buffer.alloc(SIG_BUFFER_SIZE);

    const len = Buffer.byteLength(a, "utf8");
    if (len <= SIG_BUFFER_SIZE) {
      sigBufA.fill(0);
      sigBufB.fill(0);
      const writtenA = sigBufA.write(a, 0, SIG_BUFFER_SIZE, "utf8");
      const writtenB = sigBufB.write(b, 0, SIG_BUFFER_SIZE, "utf8");

      if (writtenA !== writtenB) return false;

      return timingSafeEqual(
        sigBufA.subarray(0, writtenA),
        sigBufB.subarray(0, writtenB),
      );
    }
  }

  // Fallback untuk string panjang
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
