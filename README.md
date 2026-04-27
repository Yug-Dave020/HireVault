# HireVault

AI-powered LinkedIn career intelligence platform.

## Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL + Auth)
- **Queue**: BullMQ + Redis
- **Payments**: Stripe
- **Email**: Resend

## Structure

```
hirevault/
├── apps/
│   ├── web/        # Next.js 14
│   └── worker/     # FastAPI
├── packages/
│   └── shared/     # TypeScript types + Zod schemas
└── supabase/
    └── migrations/
```

## Getting Started

```bash
pnpm install
cp .env.example apps/web/.env.local
cp .env.example apps/worker/.env
pnpm dev
```
