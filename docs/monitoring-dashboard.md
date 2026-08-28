# Monitoring Dashboard KonkosYuk

Dokumen ini mendefinisikan strategi monitoring, rekomendasi tools, metric yang perlu di-monitor, dan alerting rules untuk mendeteksi kapan aplikasi perlu di-scale.

## 1. Metrics Endpoints

Aplikasi web menyediakan monitoring melalui:

| Service | Endpoint | Port |
|---------|----------|------|
| Web App | `http://<host>:3000/api/health/live` | 3000 |
| Web App | `http://<host>:3000/api/health/ready` | 3000 |

## 2. Rekomendasi Tools Monitoring

### 2.1 Vercel Analytics + Speed Insights

**Cocok untuk:** Production deployment di Vercel.

**Setup:**
- Aktifkan Vercel Analytics dan Speed Insights dari dashboard Vercel.
- Web Vitals (LCP, FID, CLS) ter-track otomatis.
- Sentry terintegrasi untuk error tracking.

**Keunggulan:**
- Zero-config untuk Next.js
- Real User Monitoring (RUM)
- Error tracking + performance monitoring

### 2.2 Self-Hosted: Grafana + Prometheus

**Cocok untuk:** Tim yang menginginkan kontrol penuh dan cost-effective.

**Setup:**
- Prometheus scrape config:
  ```yaml
  scrape_configs:
    - job_name: "web"
      static_configs:
        - targets: ["web:3000"]
  ```

- Grafana dashboard: Gunakan dashboard ID `4701` (Prometheus Stats) sebagai base, kemudian kustomisasi dengan metric di atas.

**Keunggulan:**
- Gratis (open source)
- Kontrol penuh atas data
- Dapat di-deploy di Docker Compose

**Kerugian:**
- Perlu maintenance sendiri
- Tidak ada built-in alerting untuk email/SMS (butuh Alertmanager)

### 2.3 Managed: Better Stack

**Cocok untuk:** Startup dan tim kecil yang ingin setup cepat.

**Setup:**
- Buat account di betterstack.com
- Tambahkan Prometheus remote write endpoint
- Atau gunakan Better Stack's built-in agent untuk scrape metric

**Keunggulan:**
- Setup dalam 5 menit
- Alerting built-in (email, SMS, Slack, PagerDuty)
- Uptime monitoring included
- Log aggregation included

**Kerugian:**
- Berbayar untuk volume tinggi
- Custom dashboard terbatas dibanding Grafana

### 2.4 Enterprise: Datadog

**Cocok untuk:** Tim enterprise dengan budget besar.

**Setup:**
- Install Datadog Agent
- Enable Prometheus metrics integration
- Enable APM untuk tracing

**Keunggulan:**
- Full observability (metrics, logs, traces, APM)
- AI-powered alerting
- Security monitoring
- Compliance reporting

**Kerugian:**
- Mahal (harga per host + per GB logs)
- Vendor lock-in

## 3. Metric yang Perlu Dimonitor

### 3.1 Response Time (Latency)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Web API p50 | < 100ms | > 300ms | > 500ms |
| Web API p95 | < 300ms | > 700ms | > 1500ms |
| Notification send | < 2000ms | > 5000ms | > 10000ms |

### 3.2 Error Rate

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Web API error rate | < 0.5% | > 2% | > 5% |
| Notification failure rate | < 1% | > 5% | > 10% |

### 3.3 Throughput

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Web req/sec | < 200 | > 400 | > 600 |
| Notifications/min | < 1000 | > 3000 | > 5000 |

### 3.4 Database Connections

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Active connections | < 10 | > 20 | > 40 |
| Connection wait time | < 10ms | > 50ms | > 100ms |

### 3.5 Redis

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Memory usage | < 70% | > 85% | > 95% |
| Connected clients | < 50 | > 100 | > 200 |
| Command latency p99 | < 5ms | > 15ms | > 30ms |

## 4. Alerting Rules

### 4.1 Response Time Alerts

```yaml
# Warning: Response time > 1s
- alert: HighResponseTimeWarning
  expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, path)) > 1
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "HTTP p95 latency tinggi pada {{ $labels.path }}"
    description: "p95 latency {{ $value }}s melebihi threshold 1s"

# Critical: Response time > 3s
- alert: HighResponseTimeCritical
  expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, path)) > 3
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "HTTP p95 latency kritis pada {{ $labels.path }}"
    description: "p95 latency {{ $value }}s melebihi threshold 3s - pertimbangkan scale up"
```

### 4.2 Error Rate Alerts

```yaml
# Warning: Error rate > 2%
- alert: HighErrorRateWarning
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 2
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "Error rate HTTP tinggi: {{ $value }}%"
    description: "Error rate melebihi 2% selama 2 menit"

# Critical: Error rate > 5%
- alert: HighErrorRateCritical
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 5
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Error rate HTTP kritis: {{ $value }}%"
    description: "Error rate melebihi 5% - butuh investigasi segera"
```

### 4.3 Health Check Alerts

```yaml
# Health check failed 3x berturut-turut
- alert: ServiceDown
  expr: up{job=~"web"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service {{ $labels.job }} down"
    description: "Health check gagal untuk {{ $labels.job }} selama 1 menit"

- alert: RepeatedHealthCheckFailure
  expr: changes(up{job=~"web"}[5m]) > 3
  for: 0m
  labels:
    severity: critical
  annotations:
    summary: "Service {{ $labels.job }} flapping"
    description: "Health check {{ $labels.job }} gagal 3x berturut-turut dalam 5 menit"
```

### 4.4 Resource Alerts

```yaml
# Database connections warning
- alert: HighDbConnectionsWarning
  expr: pg_stat_activity_count{datname="konkosyuk"} > 20
  for: 5m
  labels:
    severity: warning

# Database connections critical
- alert: HighDbConnectionsCritical
  expr: pg_stat_activity_count{datname="konkosyuk"} > 40
  for: 2m
  labels:
    severity: critical

# Redis memory warning
- alert: HighRedisMemoryWarning
  expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 85
  for: 5m
  labels:
    severity: warning
```

## 5. Kapan Perlu Scale

### 5.1 Horizontal Scale (Tambah Instance)

Scale up horizontal (tambah instance/replica) jika:
- **CPU utilization** > 70% selama > 5 menit
- **Memory utilization** > 80% selama > 5 menit
- **Error rate** > 1% yang disebabkan oleh timeout/connection refused
- **Request throughput** mendekati batas per instance

### 5.2 Vertical Scale (Upgrade Spec)

Scale up vertical (upgrade instance spec) jika:
- **CPU** selalu > 80% even setelah horizontal scale
- **Memory** > 90% dan tidak ada memory leak
- **Database connections** > 30 dari single instance
- **Latency p99** meningkat seiring bertambahnya traffic (bukan karena bottleneck eksternal)

### 5.3 Database Scale

- **Connection exhaustion**: Jika active connections > 30, pertimbangkan connection pooler (PgBouncer)
- **Slow queries**: Jika p95 query latency > 100ms, tambah index atau optimasi query
- **Disk I/O**: Jika disk latency > 20ms, pertimbangkan upgrade ke SSD atau read replica

### 5.4 Redis Scale

- **Memory > 85%**: Tambah Redis instance atau evict policy yang lebih agresif
- **Command latency p99 > 15ms**: Pertimbangkan Redis Cluster atau read replica
- **Connected clients > 100**: Review connection pooling di aplikasi

## 6. Structured Logging

Semua service telah dikonfigurasi untuk log dalam format JSON di production. Fields yang wajib:

| Field | Deskripsi | Contoh |
|-------|-----------|--------|
| `timestamp` | ISO 8601 timestamp | `2026-08-27T10:00:00.000Z` |
| `level` | Log level | `info`, `warn`, `error` |
| `service` | Nama service | `web` |
| `request_id` | UUID untuk tracing | `550e8400-e29b-41d4-a716-446655440000` |
| `duration_ms` | Durasi operasi | `150` |
| `status_code` | HTTP status | `200`, `404`, `500` |

### 6.1 Web App

Menggunakan Winston logger. Contoh log:

```json
{
  "timestamp": "2026-08-27T10:00:00.000Z",
  "level": "info",
  "service": "web",
  "category": "api",
  "message": "GET /api/properties 200 45ms",
  "method": "GET",
  "path": "/api/properties",
  "statusCode": 200,
  "duration": 45,
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 7. Sentry Performance Monitoring

Sentry dikonfigurasi dengan:
- `tracesSampleRate: 0.1` di production (10% transaksi)
- `profilesSampleRate: 0.1` di production (10% profil CPU)

### 7.1 Custom Spans

Gunakan helper di `src/lib/sentry.ts` untuk instrumentasi:

```typescript
// Database query span
import { startDatabaseSpan } from "@/lib/sentry";
const span = startDatabaseSpan("SELECT", "SELECT * FROM bookings WHERE ...");

// External API span
import { startExternalApiSpan } from "@/lib/sentry";
const span = startExternalApiSpan("Resend", "https://api.resend.com/emails");
```

### 7.2 Tracked Operations

| Operation | Span Name | Attributes |
|-----------|-----------|------------|
| PostgreSQL queries | `db: <operation>` | `db.system`, `db.operation`, `db.query` |
| Resend API calls | `external: Resend` | `http.url`, `server.address` |
| Web Push API calls | `external: WebPush` | `http.url`, `server.address` |

## 8. Scaling Decision Matrix

| Indikator | Action |
|-----------|--------|
| CPU > 70% selama 5 menit | Pertimbangkan horizontal scale |
| Memory > 80% selama 5 menit | Pertimbangkan vertical scale atau memory leak investigation |
| HTTP p95 > 500ms | Investigasi bottleneck (DB, Redis, eksternal API) |
| Error rate > 1% | Investigasi error dan fix sebelum scale |
| DB connections > 30 | Tambah connection pooler atau read replica |
| Redis memory > 85% | Tambah instance atau evict policy |