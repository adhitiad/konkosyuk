/**
 * Generic Object Pool — Mencegah GC pause dengan reuse objek.
 *
 * Alih-alih membuat objek baru setiap kali (yang memicu garbage collection),
 * pool menyimpan objek yang sudah tidak dipakai dan mengembalikannya saat
 * dibutuhkan lagi.
 */

export interface PoolOptions<T> {
  /** Factory function untuk membuat objek baru */
  create: () => T;
  /** Reset objek ke state awal sebelum di-reuse */
  reset: (obj: T) => void;
  /** Jumlah objek yang di-pre-alokasi saat pool dibuat */
  initialSize?: number;
  /** Maksimum objek yang disimpan di pool (sisanya di-GC) */
  maxSize?: number;
}

export class ObjectPool<T> {
  private readonly pool: T[] = [];
  private readonly createFn: () => T;
  private readonly resetFn: (obj: T) => void;
  private readonly maxSize: number;

  /** Berapa kali acquire() dipanggil */
  acquireCount = 0;
  /** Berapa kali objek di-reuse dari pool (bukan dibuat baru) */
  hitCount = 0;

  constructor(options: PoolOptions<T>) {
    this.createFn = options.create;
    this.resetFn = options.reset;
    this.maxSize = options.maxSize ?? 64;

    const initialSize = options.initialSize ?? 8;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * Ambil objek dari pool. Jika pool kosong, buat baru.
   * Objek yang di-return sudah di-reset ke state awal.
   */
  acquire(): T {
    this.acquireCount++;
    const obj = this.pool.pop();
    if (obj !== undefined) {
      this.hitCount++;
      this.resetFn(obj);
      return obj;
    }
    return this.createFn();
  }

  /**
   * Kembalikan objek ke pool agar bisa di-reuse.
   * Jika pool sudah penuh, objek akan di-buang (GC).
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
    // else: let GC collect it
  }

  /** Jumlah objek yang tersedia di pool saat ini */
  get available(): number {
    return this.pool.length;
  }

  /** Hit rate: persentase acquire yang bisa di-serve dari pool */
  get hitRate(): number {
    return this.acquireCount === 0
      ? 0
      : this.hitCount / this.acquireCount;
  }

  /** Bersihkan semua objek di pool */
  drain(): void {
    this.pool.length = 0;
  }
}

// ---------------------------------------------------------------------------
// Specialized Pools
// ---------------------------------------------------------------------------

/** Metric object yang di-reuse di monitoring.ts */
export interface PooledMetric {
  requests: number;
  errors: number;
  totalLatencyMs: number;
  lastLatencyMs: number;
  lastErrorAt?: string;
  lastError?: string;
}

export const MetricPool = new ObjectPool<PooledMetric>({
  create: () => ({
    requests: 0,
    errors: 0,
    totalLatencyMs: 0,
    lastLatencyMs: 0,
    lastErrorAt: undefined,
    lastError: undefined,
  }),
  reset: (m) => {
    m.requests = 0;
    m.errors = 0;
    m.totalLatencyMs = 0;
    m.lastLatencyMs = 0;
    m.lastErrorAt = undefined;
    m.lastError = undefined;
  },
  initialSize: 16,
  maxSize: 128,
});

/** RateLimitResult object yang di-reuse */
export interface PooledRateLimitResult {
  success: boolean;
  remaining: number;
  resetAtMs: number; // Pakai timestamp number, bukan Date object
}

export const RateLimitResultPool = new ObjectPool<PooledRateLimitResult>({
  create: () => ({
    success: false,
    remaining: 0,
    resetAtMs: 0,
  }),
  reset: (r) => {
    r.success = false;
    r.remaining = 0;
    r.resetAtMs = 0;
  },
  initialSize: 16,
  maxSize: 64,
});

/**
 * Reusable object untuk cookie parsing.
 * Kunci di-clear setiap kali, tapi objek itu sendiri di-reuse.
 */
export interface PooledCookieMap {
  [key: string]: string;
}

export const CookieMapPool = new ObjectPool<PooledCookieMap>({
  create: () => Object.create(null) as PooledCookieMap,
  reset: (m) => {
    for (const key in m) {
      delete m[key];
    }
  },
  initialSize: 8,
  maxSize: 32,
});
