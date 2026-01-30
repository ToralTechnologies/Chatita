# Chatita - Your Diabetes Companion

A warm, caring bilingual (English/Spanish) diabetes companion app with a "caring grandmother" persona.

## Features

- 📸 Quick meal photo logging
- 💙 Gentle, warm AI-powered insights
- 🍽️ Menu scanning for restaurant recommendations
- 🎯 Support for underserved users (manual glucose entry, no CGM required)
- 💬 Conversational chat interface
- 🎗️ Contextual health tracking (period, feeling unwell, stress)

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend:** Next.js API routes
- **Database:** Neon Postgres (free tier)
- **ORM:** Prisma
- **Auth:** NextAuth.js
- **Hosting:** Vercel (free tier)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

1. Create a free account at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

5. Update `DATABASE_URL` in `.env`

### 3. Set Up Prisma

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data
npx prisma db seed
```

### 4. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in `.env`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for all required variables.

### Cost Structure

**Free Tier ($0/month):**
- Hosting: Vercel (unlimited for hobby projects)
- Database: Neon Postgres (0.5 GB)
- Auth: NextAuth (self-hosted)
- Storage: Base64 in DB (for MVP)
- AI Features: Disabled

**Paid Tier (~$5-9/month):**
- All free tier features
- Claude 3.5 Sonnet vision analysis: ~$3-5/month
- Claude 3.5 Sonnet chat: ~$2-4/month

## Project Structure

```
chatita/
├── app/                  # Next.js App Router
│   ├── (auth)/          # Auth routes
│   ├── (onboarding)/    # Onboarding flow
│   ├── (main)/          # Main app routes
│   └── api/             # API routes
├── components/          # React components
├── lib/                 # Utilities and configs
├── prisma/              # Database schema
└── types/               # TypeScript types
```

## Development Phases

- [x] Phase 1: Core setup (Next.js + Prisma + Auth)
- [ ] Phase 2: Onboarding + Home dashboard
- [ ] Phase 3: Meal logging
- [ ] Phase 4: Menu scanner
- [ ] Phase 5: Insights & rewards
- [ ] Phase 6: Chat assistant
- [ ] Phase 7: Internationalization

## License

MIT

## Support

For questions or issues, please open a GitHub issue.

---

Built with ❤️ for the diabetes community
