# Konkosyuk - Sistem Booking Kost & Kontrakan

Aplikasi booking kost dan kontrakan dengan fitur lengkap: manajemen properti, booking paket durasi, pembayaran, review, dan maintenance.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Better Auth (Email/Password + Google OAuth)
- **State Management**: TanStack Query (React Query)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Icons**: Hugeicons
- **Language**: TypeScript

## Features

- Role-based access: Customer, Owner, Admin, Staff
- Property management dengan paket harga dinamis (Kost/Kontrakan)
- Booking system dengan kalkulasi DP otomatis
- Payment integration (Sakuku, Doku, Nicepay)
- Webhook handling untuk payment verification
- Review & reputasi sistem (tenant & property)
- Maintenance ticket system
- Push notification (Web Push API)
- Cron job untuk cleanup booking expired
- Multi-language support (i18n)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL >= 14
- Node.js >= 18

### Installation

```bash
# Clone repository
git clone <repository-url>
cd konkosyuk

# Install dependencies
bun install

# Setup environment variables
cp .env.example .env.local
```

### Database Setup

```bash
# Generate migration (jika ada perubahan schema)
bun run db:generate

# Jalankan migration
bun run db:migrate

# Seed data awal (opsional)
bun run db:seed
```

### Development

```bash
# Start development server
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Testing

```bash
# Run tests
bun run test

# Run tests with UI
bun run test:ui
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages (login, register)
│   ├── (protected)/       # Protected routes
│   │   ├── dashboard/     # Customer dashboard
│   │   ├── owner/         # Owner dashboard
│   │   └── admin/         # Admin dashboard
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── owner/            # Owner-specific components
│   └── maintenance/      # Maintenance components
├── db/                   # Database schema & connection
├── lib/                  # Utilities, auth, validation
│   ├── types/            # TypeScript type definitions
│   ├── payments/         # Payment calculation utilities
│   └── __tests__/        # Unit tests
└── messages/             # i18n translation files
```

## Available Scripts

| Script | Deskripsi |
|--------|-----------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run test` | Run Vitest tests |
| `bun run test:ui` | Run Vitest with UI |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run migrations |
| `bun run db:push` | Push schema to DB (no migration) |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run db:seed` | Seed database |

## Environment Variables

See `.env.example` for all available environment variables.

### Required for Production

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret (min 32 chars)
- `BETTER_AUTH_URL` - Production URL
- `NEXT_PUBLIC_APP_URL` - Public app URL
- `PAYMENT_MODE=live` - Set to `live` for production

## Deployment

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for detailed deployment guide.

### Recommended Platforms

- **Vercel** (Recommended for Next.js)
- **Render**
- **Railway**
- **DigitalOcean App Platform**

## License

Private - All rights reserved
