import { describe, it, expect } from "vitest";
import {
  ObjectPool,
  MetricPool,
  RateLimitResultPool,
  CookieMapPool,
  acquireBuffer,
  releaseBuffer,
  getBufferPoolStats,
  encodeSSE,
  encodeSSEPing,
  CsvBuffer,
  timingSafeCompare,
  sharedEncoder,
  sharedDecoder,
} from "@/lib/perf";

describe("ObjectPool", () => {
  it("initializes with pre-allocated items", () => {
    const pool = new ObjectPool<{ val: number }>({
      create: () => ({ val: 0 }),
      reset: (obj) => {
        obj.val = 0;
      },
      initialSize: 4,
      maxSize: 10,
    });

    expect(pool.available).toBe(4);
  });

  it("reuses released items and triggers reset callback", () => {
    const pool = new ObjectPool<{ val: number }>({
      create: () => ({ val: 0 }),
      reset: (obj) => {
        obj.val = 0;
      },
      initialSize: 1,
      maxSize: 5,
    });

    const item = pool.acquire();
    item.val = 42;
    pool.release(item);

    expect(pool.available).toBe(1);

    const reacquired = pool.acquire();
    expect(reacquired).toBe(item);
    expect(reacquired.val).toBe(0); // Reset was called
  });

  it("calculates hit rate accurately", () => {
    const pool = new ObjectPool<number[]>({
      create: () => [],
      reset: (arr) => {
        arr.length = 0;
      },
      initialSize: 2,
    });

    pool.acquire(); // hit from preallocated
    pool.acquire(); // hit from preallocated
    pool.acquire(); // miss (allocated fresh)

    expect(pool.hitRate).toBeCloseTo(2 / 3);
  });

  it("respects maxSize when releasing", () => {
    const pool = new ObjectPool<{ id: number }>({
      create: () => ({ id: Math.random() }),
      reset: () => {},
      initialSize: 0,
      maxSize: 2,
    });

    const o1 = pool.acquire();
    const o2 = pool.acquire();
    const o3 = pool.acquire();

    pool.release(o1);
    pool.release(o2);
    pool.release(o3); // Exceeds maxSize=2, discarded

    expect(pool.available).toBe(2);
  });

  it("drains pool properly", () => {
    const pool = new ObjectPool<{ count: number }>({
      create: () => ({ count: 0 }),
      reset: () => {},
      initialSize: 5,
    });

    expect(pool.available).toBe(5);
    pool.drain();
    expect(pool.available).toBe(0);
  });
});

describe("Specialized Pools", () => {
  it("MetricPool provides clean metric object", () => {
    const metric = MetricPool.acquire();
    expect(metric.requests).toBe(0);
    expect(metric.errors).toBe(0);
    expect(metric.totalLatencyMs).toBe(0);

    metric.requests = 10;
    MetricPool.release(metric);

    const reacquired = MetricPool.acquire();
    expect(reacquired.requests).toBe(0);
    MetricPool.release(reacquired);
  });

  it("RateLimitResultPool provides clean result object", () => {
    const res = RateLimitResultPool.acquire();
    expect(res.success).toBe(false);
    expect(res.remaining).toBe(0);
    expect(res.resetAtMs).toBe(0);

    res.success = true;
    res.remaining = 5;
    RateLimitResultPool.release(res);

    const reacquired = RateLimitResultPool.acquire();
    expect(reacquired.success).toBe(false);
    RateLimitResultPool.release(reacquired);
  });

  it("CookieMapPool clears old keys on reuse", () => {
    const map = CookieMapPool.acquire();
    map["session"] = "token123";
    map["theme"] = "dark";
    CookieMapPool.release(map);

    const reacquired = CookieMapPool.acquire();
    expect(Object.keys(reacquired).length).toBe(0);
    expect(reacquired["session"]).toBeUndefined();
    CookieMapPool.release(reacquired);
  });
});

describe("BufferPool & TypedArray", () => {
  it("acquires and releases matching bucket buffers", () => {
    const buf = acquireBuffer(100); // should pick 256B bucket
    expect(buf.byteLength).toBe(256);

    releaseBuffer(buf);
    const stats = getBufferPoolStats();
    expect(stats["bucket_256B"]).toBeGreaterThanOrEqual(1);

    const reused = acquireBuffer(200);
    expect(reused).toBe(buf);
  });

  it("allocates direct buffer for requests exceeding max bucket", () => {
    const largeBuf = acquireBuffer(100000);
    expect(largeBuf.byteLength).toBe(100000);
  });

  it("sharedEncoder and sharedDecoder work correctly", () => {
    const text = "KonkosYuk Performance Test 🚀";
    const encoded = sharedEncoder.encode(text);
    expect(ArrayBuffer.isView(encoded)).toBe(true);
    const decoded = sharedDecoder.decode(encoded);
    expect(decoded).toBe(text);
  });

  it("encodeSSE formats Server-Sent Events properly", () => {
    const data = { message: "hello", count: 1 };
    const bytes = encodeSSE("evt-123", "custom", data);
    const decoded = sharedDecoder.decode(bytes);

    expect(decoded).toBe(
      `id: evt-123\nevent: custom\ndata: ${JSON.stringify(data)}\n\n`,
    );
  });

  it("encodeSSEPing returns pre-encoded ping bytes", () => {
    const bytes = encodeSSEPing();
    const decoded = sharedDecoder.decode(bytes);
    expect(decoded).toBe(": ping\n\n");
  });
});

describe("CsvBuffer", () => {
  it("builds CSV content and produces correct Uint8Array and Blob", () => {
    const csv = new CsvBuffer();
    csv.appendLine("name,age,city");
    csv.appendLine("Alice,30,Jakarta");
    csv.appendLine("Bob,25,Bandung");

    expect(csv.byteLength).toBeGreaterThan(0);

    const u8 = csv.toUint8Array();
    const text = sharedDecoder.decode(u8);
    expect(text).toBe("name,age,city\nAlice,30,Jakarta\nBob,25,Bandung\n");

    const blob = csv.toBlob();
    expect(blob.type).toBe("text/csv;charset=utf-8;");

    csv.reset();
    expect(csv.byteLength).toBe(0);
  });
});

describe("timingSafeCompare", () => {
  it("returns true for identical signatures", () => {
    const sig =
      "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0";
    expect(timingSafeCompare(sig, sig)).toBe(true);
  });

  it("returns false for different length signatures", () => {
    expect(timingSafeCompare("abcdef", "abc")).toBe(false);
  });

  it("returns false for same length different content", () => {
    expect(timingSafeCompare("abcdef123456", "abcdef123457")).toBe(false);
  });

  it("handles long signatures beyond pre-allocated buffer correctly", () => {
    const long1 = "a".repeat(500);
    const long2 = "a".repeat(500);
    const long3 = "a".repeat(499) + "b";

    expect(timingSafeCompare(long1, long2)).toBe(true);
    expect(timingSafeCompare(long1, long3)).toBe(false);
  });
});
