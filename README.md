# HireVault

AI-powered job scraper and CV generator for the German/EU market.

## Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Scraper**: Playwright (Indeed, StepStone, Xing, Glassdoor)
- **AI**: Groq / Anthropic Claude
- **Queue**: BullMQ + Redis
- **Payments**: Stripe
- **Email**: Resend

## Structure

```
hirevault/
├── apps/
│   ├── web/              # Next.js 14
│   └── worker/
│       ├── scraper/      # Playwright job scrapers
│       ├── ai/           # JD analysis, CV generation, scoring
│       └── export/       # PDF and DOCX export
├── packages/
│   └── shared/           # TypeScript types + Zod schemas
├── supabase/migrations/
└── .github/workflows/
```

## Getting Started

```bash
pnpm install
cp .env.example apps/web/.env.local
cp .env.example apps/worker/.env
pnpm dev
```
