# Deployment Guide - KonkosYuk

Platform deployment yang direkomendasikan untuk KonkosYuk adalah **Vercel** karena:

- Native support untuk Next.js 16 App Router
- Optimized untuk Edge Functions dan Server Components
- Automatic preview deployments untuk Pull Requests
- Built-in analytics dan monitoring

Namun, konfigurasi untuk **Netlify** juga tersedia untuk fleksibilitas.

---

## 🚀 Deployment ke Vercel (Recommended)

### 1. Persiapan

Pastikan Anda memiliki:

- Akun Vercel
- Repository GitHub yang terhubung

### 2. Deploy

```bash
# Install Vercel CLI
bun add -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 3. Environment Variables

Set environment variables di Vercel Dashboard:

- Buka project Settings > Environment Variables
- Tambahkan semua variable dari `.env.example`
- Pastikan `DATABASE_URL`, `REDIS_URL`, dan secrets ter-set

### 4. Database Setup

```bash
# Run migrations di production
vercel env pull .env.production
bun run db:push
```

---

## 🌐 Deployment ke Netlify

### 1. Persiapan

File `netlify.toml` sudah dikonfigurasi di repository.

### 2. Build Settings

- **Build command:** `bun run build`
- **Publish directory:** `.next`
- **Node version:** 20

### 3. Environment Variables

Set environment variables di Netlify Dashboard:

- Site settings > Environment variables
- Tambahkan semua variable dari `.env.example`

### 4. Database Setup

```bash
# Run migrations via Netlify CLI
netlify functions:invoke --name db-migrate
```

---

## 🔄 CI/CD Pipeline

Pipeline GitHub Actions akan berjalan otomatis pada:

1. **Push ke `main`** - Run tests, build, dan deploy ke production
2. **Pull Request** - Run tests dan type check
3. **Push ke `develop`** - Run tests dan type check

### Jobs

| Job          | Deskripsi                                    |
| ------------ | -------------------------------------------- |
| `lint`       | ESLint check                                 |
| `typecheck`  | TypeScript type checking                     |
| `unit-tests` | Vitest unit tests dengan coverage            |
| `e2e-tests`  | Playwright E2E tests                         |
| `security`   | `bun audit` untuk dependency vulnerabilities |
| `build`      | Next.js production build                     |
| `deploy`     | Deploy ke Netlify (hanya untuk branch main)  |

### Secrets yang Diperlukan

Tambahkan secrets berikut di GitHub Repository Settings > Secrets and variables > Actions:

```
DATABASE_URL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
BETTER_AUTH_SECRET
BETTER_AUTH_URL
NEXT_PUBLIC_APP_URL
PAYMENT_MODE
DOKU_CLIENT_ID
DOKU_SECRET_KEY
DOKU_WEBHOOK_SECRET
IPAYMU_API_KEY
IPAYMU_SECRET_KEY
IPAYMU_WEBHOOK_SECRET
NICEPAY_CLIENT_ID
NICEPAY_SECRET_KEY
NICEPAY_WEBHOOK_SECRET
UPLOADTHING_TOKEN
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
VAPID_PRIVATE_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

---

## 🔐 Security Best Practices

### Environment Variables

1. **Jangan commit `.env.local`** - Sudah ada di `.gitignore`
2. **Gunakan platform secrets** - Jangan hardcode di kode
3. **Rotate secrets secara berkala** - Terutama payment gateway credentials
4. **Gunakan different keys untuk staging dan production**

### GitHub Actions Secrets

```yaml
# Simpan secrets di GitHub Settings
# Jangan pernah echo atau log secrets di workflow
```

### Netlify Environment Variables

1. Buka Site settings > Environment variables
2. Set untuk Production, Deploy Previews, dan Branches
3. Gunakan Netlify CLI untuk local testing:
   ```bash
   netlify env:set DATABASE_URL "postgresql://..."
   ```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoints

| Endpoint                  | Deskripsi                             |
| ------------------------- | ------------------------------------- |
| `GET /api/health`         | Unified health check (semua services) |
| `GET /api/health/db`      | Database connection                   |
| `GET /api/health/redis`   | Redis connection                      |
| `GET /api/health/payment` | Payment gateway connectivity          |
| `GET /api/health/storage` | Storage provider connectivity         |

### Response Format

```json
{
  "status": "healthy",
  "timestamp": "2026-08-14T11:00:00.000Z",
  "checks": {
    "database": { "status": "healthy", "latency": 12 },
    "redis": { "status": "healthy", "latency": 5 },
    "storage": { "status": "healthy", "providers": [...] },
    "payments": { "status": "healthy", "providers": [...] }
  }
}
```

---

## 🔄 Rollback Strategy

### Vercel

```bash
# Rollback ke deployment sebelumnya
vercel rollback
```

### Netlify

```bash
# Rollback via Netlify UI atau CLI
netlify rollback:list
netlify rollback [deployment-id]
```

### Database Migration Rollback

```bash
# Drizzle tidak punya built-in rollback
# Gunakan manual SQL atau restore dari backup
bun run db:baseline  # Reset migrations
```

---

## 📈 Performance Optimization

### Build Optimization

1. **Output Standalone** - Sudah dikonfigurasi di `next.config.ts`
2. **Image Optimization** - Next.js automatic dengan remote patterns
3. **Font Optimization** - next/font untuk Google Fonts
4. **Script Optimization** - next/script untuk third-party scripts

### Caching Strategy

| Resource          | Cache Policy        |
| ----------------- | ------------------- |
| `/_next/static/*` | 1 tahun (immutable) |
| `/images/*`       | 1 hari              |
| API responses     | No-cache (dynamic)  |

---

## 🆘 Troubleshooting

### Build Failed

```bash
# Clear cache dan rebuild
rm -rf .next node_modules
bun install
bun run build
```

### Database Connection Issues

```bash
# Check connection
bun -e "console.log(process.env.DATABASE_URL)"

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Redis Connection Issues

```bash
# Check Redis connection
redis-cli ping
```

---

## 📞 Support

Jika mengalami masalah deployment:

1. Cek [GitHub Issues](https://github.com/adhitiadwima/konkosyuk/issues)
2. Buka [Discussions](https://github.com/adhitiadwima/konkosyuk/discussions)
