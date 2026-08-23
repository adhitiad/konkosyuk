# Performance Optimization Guide - KonkosYuk

## 📋 Ringkasan Optimasi

Dokumen ini menjelaskan optimasi performa yang telah diimplementasikan pada platform KonkosYuk.

---

## 1. Database & Query Optimization

### Index yang Ditambahkan

Migration `0013_performance_indexes.sql` menambahkan index berikut:

| Tabel                 | Index                                        | Kolom                                            | Tujuan                                 |
| --------------------- | -------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| `properties`          | `properties_is_active_status_type_idx`       | `(is_active, status, type)`                      | Filter properti aktif berdasarkan tipe |
| `properties`          | `properties_is_active_city_type_idx`         | `(is_active, city, type)`                        | Filter properti per kota               |
| `properties`          | `properties_base_price_idx`                  | `(base_price)`                                   | Range query harga                      |
| `properties`          | `properties_created_at_idx`                  | `(created_at)`                                   | Sorting by newest                      |
| `properties`          | `properties_gps_is_active_location_idx`      | `(gps_verified, is_active, latitude, longitude)` | Geospatial queries                     |
| `properties`          | `properties_owner_id_is_active_idx`          | `(owner_id, is_active)`                          | Owner property listing                 |
| `units`               | `units_property_id_status_idx`               | `(property_id, status)`                          | Cek ketersediaan unit                  |
| `bookings`            | `bookings_user_id_status_created_at_idx`     | `(user_id, status, created_at)`                  | Booking history user                   |
| `bookings`            | `bookings_unit_id_status_dates_idx`          | `(unit_id, status, start_date, end_date)`        | Availability check                     |
| `bookings`            | `bookings_end_date_idx`                      | `(end_date)`                                     | Cleanup cron job                       |
| `payments`            | `payments_status_created_at_idx`             | `(status, created_at)`                           | Payment status queries                 |
| `payments`            | `payments_booking_id_status_idx`             | `(booking_id, status)`                           | Verify booking payment                 |
| `reviews`             | `reviews_property_id_created_at_idx`         | `(property_id, created_at)`                      | Property reviews                       |
| `reviews`             | `reviews_reviewed_user_type_created_at_idx`  | `(reviewed_user_id, type, created_at)`           | User reputation                        |
| `maintenance_reports` | `maintenance_reports_property_id_status_idx` | `(property_id, status)`                          | Maintenance by property                |

### Eager Loading (Menghindari N+1)

**File:** `src/lib/db/query-examples.ts`

Contoh query yang efisien menggunakan Drizzle Relations:

```typescript
// ✅ Eager Loading dengan `with`
const properties = await db.query.properties.findMany({
  with: {
    owner: true,
    units: true,
    bookings: true,
  },
});
```

### Cursor-based Pagination

**File:** `src/app/api/properties/cursor-optimized.ts`

Keuntungan cursor pagination vs offset:

- **Offset:** `LIMIT 20 OFFSET 10000` - lambat pada data besar
- **Cursor:** `WHERE id > 'last_id' LIMIT 20` - konsisten cepat

```typescript
// Request
GET /api/properties?limit=20&cursor=abc123

// Response
{
  "data": [...],
  "meta": {
    "nextCursor": "def456",
    "hasMore": true
  }
}
```

---

## 2. Image & Media Optimization

### Next.js Image Configuration

**File:** `next.config.ts`

```typescript
images: {
  formats: ['image/avif', 'image/webp'], // Modern formats
  remotePatterns: [
    { protocol: "https", hostname: "**.uploadthing.com" },
    { protocol: "https", hostname: "utfs.io" },
    { protocol: "https", hostname: "res.cloudinary.com" },
    // ...
  ],
}
```

### Client-side Image Compression

**File:** `src/lib/image-compression.ts`

```typescript
import { compressImage, validateImageFile } from "@/lib/image-compression";

// Compress before upload
const compressedFile = await compressImage(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
});
```

### Optimized Image Component

**File:** `src/components/ui/optimized-image.tsx`

```typescript
<OptimizedImage
  src={property.images[0]}
  size="card" // thumbnail | card | detail | original
  alt={property.name}
  width={400}
  height={300}
/>
```

### Cloudinary Transformations

**File:** `src/lib/image-optimizer.ts`

| Size        | Transformations                  |
| ----------- | -------------------------------- |
| `thumbnail` | `w_200,h_150,c_fill,q_60,f_auto` |
| `card`      | `w_400,h_300,c_fill,q_75,f_auto` |
| `detail`    | `w_800,h_600,c_fill,q_85,f_auto` |
| `original`  | `q_auto,f_auto`                  |

---

## 3. Caching Strategy (Redis)

### Cache Wrapper

**File:** `src/lib/cache.ts`

```typescript
import { getCachedData, invalidateCacheByTag } from "@/lib/cache";

// Simple cache
const data = await getCachedData(
  "properties:list",
  () => fetchPropertiesFromDb(),
  { ttlSeconds: 300, tags: ["properties"] },
);

// Invalidate by tag
await invalidateCacheByTag("properties");
```

### Data yang Dicache

| Data                     | TTL    | Alasan                            |
| ------------------------ | ------ | --------------------------------- |
| Daftar properti (public) | 60s    | Jarang berubah, banyak di-request |
| Daftar fasilitas/tags    | 3600s  | Static data                       |
| Halaman statis           | 86400s | CDN-level caching                 |
| User profile             | 300s   | Personal data, moderate change    |

### Cache Key Strategy

```typescript
const key = buildCacheKey("properties", {
  ownerId: "123",
  type: "kost",
  city: "Jakarta",
  limit: 20,
});
// Result: properties:city:Jakarta:limit:20:ownerId:123:type:kost
```

---

## 4. Pagination & Infinite Scroll

### Cursor-based Pagination

**Keuntungan:**

- Konsisten performa pada data besar
- Tidak ada masalah "missing rows" saat data baru ditambahkan
- Cocok untuk infinite scroll

**Implementasi:**

```typescript
// Frontend
const [items, setItems] = useState([]);
const [cursor, setCursor] = useState(null);

const loadMore = async () => {
  const res = await fetch(`/api/properties?limit=20&cursor=${cursor}`);
  const data = await res.json();
  setItems((prev) => [...prev, ...data.data]);
  setCursor(data.meta.nextCursor);
};

// Gunakan IntersectionObserver untuk infinite scroll
```

### Offset Pagination (untuk admin)

Tetap gunakan offset pagination untuk:

- Admin dashboard dengan halaman tetap
- Export data
- Search dengan filter kompleks

---

## 5. Core Web Vitals Optimization

### LCP (Largest Contentful Paint)

- **Next.js Image optimization** dengan `loading="lazy"` untuk images di bawah fold
- **Priority loading** untuk hero image properti
- **Cloudinary transformations** untuk ukuran yang sesuai

```typescript
<Image
  src={property.images[0]}
  alt={property.name}
  priority // Hero image
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### CLS (Cumulative Layout Shift)

- **Fixed aspect ratio** untuk property cards
- **Skeleton UI** saat loading
- **Placeholder images** untuk mencegah layout shift

```typescript
// Property card dengan fixed aspect ratio
<div className="aspect-video relative">
  <Image
    src={url}
    alt={name}
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
</div>
```

### FID/INP (Interaction)

- **Suspense boundaries** untuk streaming data
- **Skeleton UI** untuk memberikan feedback visual
- **Debounced search** untuk input pencarian

```typescript
<Suspense fallback={<PropertyListSkeleton count={6} />}>
  <PropertyList properties={properties} />
</Suspense>
```

### Skeleton Components

**File:** `src/components/ui/skeleton/property-skeletons.tsx`

```typescript
import { PropertyListSkeleton, PropertyCardSkeleton, PropertyDetailSkeleton } from '@/components/ui/skeleton/property-skeletons'

// Usage in page
<Suspense fallback={<PropertyListSkeleton count={6} />}>
  <PropertyList />
</Suspense>
```

---

## 6. Monitoring & Metrics

### Key Metrics to Track

| Metric         | Target  | Tool                                |
| -------------- | ------- | ----------------------------------- |
| LCP            | < 2.5s  | Vercel Analytics / Google PageSpeed |
| FID            | < 100ms | Vercel Analytics                    |
| CLS            | < 0.1   | Vercel Analytics                    |
| TTFB           | < 600ms | Vercel Analytics                    |
| DB Query Time  | < 100ms | Application logging                 |
| Cache Hit Rate | > 80%   | Redis monitoring                    |

### Health Check Endpoints

```
GET /api/health - Unified health check
GET /api/health/db - Database latency
GET /api/health/redis - Redis connectivity
GET /api/health/payment - Payment gateway status
GET /api/health/storage - Storage provider status
```

---

## 7. Migration Guide

### Apply Database Indexes

```bash
# Generate migration from schema changes
bun run db:generate

# Or push directly (development only)
bun run db:push
```

### Deploy Cache Wrapper

```bash
# No additional deployment needed - just deploy the code
bun run build
```

### Verify Performance

```bash
# Run Lighthouse
npx lighthouse http://localhost:3000 --view

# Check bundle size
bun run build
ls -la .next/static/chunks/
```

---

## 8. Best Practices

### Database

- ✅ Gunakan index untuk kolom yang sering di-filter
- ✅ Gunakan composite index untuk kombinasi filter
- ✅ Hindari `SELECT *` - pilih kolom yang dibutuhkan
- ✅ Gunakan eager loading untuk menghindari N+1
- ✅ Gunakan cursor pagination untuk data besar

### Images

- ✅ Kompres gambar sebelum upload
- ✅ Gunakan WebP/AVIF format
- ✅ Lazy load images di bawah fold
- ✅ Gunakan Cloudinary transformations
- ✅ Set aspect ratio untuk mencegah CLS

### Caching

- ✅ Cache data yang jarang berubah
- ✅ Gunakan TTL yang sesuai
- ✅ Invalidate cache saat data berubah
- ✅ Gunakan cache tags untuk bulk invalidation

### React/Next.js

- ✅ Gunakan Suspense untuk streaming
- ✅ Gunakan Skeleton UI
- ✅ Lazy load komponen berat
- ✅ Avoid client-side data fetching when possible
