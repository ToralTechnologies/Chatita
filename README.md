# Chatita — Your Diabetes Companion

A warm, caring, **fully bilingual (English/Spanish)** diabetes companion for underserved communities. Companion, not prescriber: balance over restriction, and cultural food is non-negotiable.

- **Product:** https://chatita.app
- **Marketing:** https://chatitahealth.com

## Features

### Tracking
- 📸 Meal logging from a photo (Claude vision reads the plate), manual entry, or barcode scan
- 🩸 Glucose tracking: manual entries plus **CGM integrations** — FreeStyle Libre (LibreLinkUp) and Dexcom, with automatic timestamp/lag handling and meal linking
- 📉 **Blood-sugar impact per meal**: pre-meal baseline, post-meal peak, rise, and time-to-peak computed from CGM readings in a −30 min/+3 h window around each meal — for any meal age, not just recent ones
- 🌙 Sleep, 🩶 mood (check-in flow with body symptoms/cravings/context), 🚶 movement, 💧 hydration, and optional cycle tracking
- ⌚ Connected health: Google Health/Fitbit OAuth sync and Apple Health export upload (browser-side ZIP parsing)

### AI (Claude)
- 💬 Chat with Chatita (`claude-sonnet-4-6` for safety-critical conversation) with full health context: glucose, meals, mood, sleep, cultural food profile, daily nutrition totals
- 📍 **Location-aware food suggestions in chat**: when you ask "what can I eat near me", Chatita asks for consent in the moment, looks up real nearby restaurants (Google Places), and recommends specific options that fit your current health picture. Coordinates are never stored — see Privacy.
- 🍽️ Menu scanning (photo → ranked dishes), meal analysis, recipe generation from your pantry, meal plans, AI insights (`claude-haiku-4-5` for structured extraction)

### Analytics & data
- 📊 Insights dashboard: glucose timeline/time-of-day views, time in range, estimated A1C, per-meal-type comparisons, AI-generated gentle patterns (in your language)
- 📥 Export as PDF or CSV (UTF-8 with BOM — accents and emoji survive Excel), chat transcript export
- 📧 Weekly email reports

### Experience
- 🌍 Fully bilingual UI (see the contributor rule below), locale-aware dates/times
- 🎨 Chatita design system: navy/cream palette, DM Serif Display + DM Sans, dark mode
- 📱 Responsive web + mobile web with ≥44px touch targets

## Tech stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + TailwindCSS
- **Backend:** Next.js API routes; Vercel cron jobs (workers run on **GET**)
- **Database:** Neon Postgres via Prisma
- **Auth:** NextAuth.js (credentials + Google OAuth) with an email allowlist
- **AI:** Anthropic Claude — `claude-sonnet-4-6` (chat/triage), `claude-haiku-4-5-20251001` (meal/menu/insights/recipes)
- **Places:** Google Places API (optional, `ENABLE_GOOGLE_PLACES=true`)
- **State:** React Query · **Charts:** Recharts · **Export:** jsPDF, PapaParse

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
# Fill in at minimum: DATABASE_URL (Neon), NEXTAUTH_SECRET (openssl rand -base64 32),
# NEXTAUTH_URL (http://localhost:3000), ALLOWED_EMAILS

# 3. Database schema (current workflow uses db push)
npx prisma generate
npx prisma db push

# 4. Run
npm run dev
```

Open http://localhost:3000.

### Environment variables

See `.env.example` for the full list. Highlights:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | NextAuth session signing + base URL |
| `ALLOWED_EMAILS` | Comma-separated email allowlist (access control) |
| `ANTHROPIC_API_KEY`, `ENABLE_AI_CHAT`, `ENABLE_AI_ANALYSIS` | Claude features |
| `ENABLE_GOOGLE_PLACES`, `GOOGLE_MAPS_API_KEY` | Restaurant finder + chat nearby-food suggestions (falls back to simulated data when disabled) |
| `ENCRYPTION_KEY` | 64 hex chars; AES-256-GCM for stored CGM credentials |
| `DEXCOM_CLIENT_ID/SECRET/ENVIRONMENT/REDIRECT_URI` | Dexcom OAuth |
| `GOOGLE_HEALTH_CLIENT_ID/SECRET/REDIRECT_URI` | Google Health OAuth |
| `CRON_SECRET` | Protects `/api/cron/*` routes (Vercel cron calls them via GET) |
| `SMTP_*` | Weekly report email |
| `USDA_API_KEY` | FoodData Central nutrition search |

## Contributing rules

1. **Every user-facing string must exist in both English and Spanish — no exceptions.**
   UI strings live in `lib/i18n/translations.ts` (keyed groups, `useTranslation()`); label-heavy vocab (mood words, symptoms, chips) uses `lib/i18n/vocab.ts`. Spanish is warm, informal Mexican Spanish (tuteo — "tú", never "usted"). Dates/times must be locale-aware, not just translated.
2. **Privacy:** never store or log user coordinates. Location is requested in the moment, used for a single lookup, and discarded (see `app/privacy/page.tsx`).
3. **Clinical framing:** IDF/WHO global principles; ADA is a U.S. regional layer. Companion, not prescriber — see `PRODUCT_VISION.md` and `CLINICAL_GUIDANCE_FRAMEWORK.md`.
4. Cron route handlers must respond to **GET** (Vercel cron uses GET; POST-only workers silently never run).
5. Brand: `#E3171A` (Rojo Corazón) is a warmth accent only — never a large surface. Danger states use `#D0021B`.

## Project structure

```
app/                 # App Router: (auth), (onboarding), (main), api/
components/          # React components (cards, charts, chat, forms)
lib/                 # ai/, health/, i18n/, hooks/, sync + domain logic
prisma/              # schema.prisma, migrations, seed
scripts/             # admin utilities + one-time data migrations
types/               # shared TypeScript types
```

## License

MIT — built with ❤️ for the diabetes community.
