# Chatita - Your Diabetes Companion

A warm, caring bilingual (English/Spanish) diabetes companion app with a "caring grandmother" persona.

## Features

### Core Features
- 📸 Quick meal photo logging with AI analysis
- 💙 Gentle, warm AI-powered insights and chat assistance
- 🍽️ Menu scanning for restaurant recommendations
- 🎯 Support for underserved users (manual glucose entry, no CGM required)
- 💬 Conversational chat interface with context awareness
- 🎗️ Contextual health tracking (mood, stress, activity levels)

### Analytics & Insights
- 📊 Comprehensive analytics dashboard with charts
- 🔍 Pattern detection (glucose spikes, time-of-day trends)
- 📈 A1C estimation based on glucose readings
- 📉 Time in range tracking and visualization
- 🎯 Meal type comparison and daily pattern analysis

### Data Management
- 📥 Export data as PDF (formatted reports) or CSV (spreadsheet)
- 📧 Weekly email reports with progress summaries
- 📅 AI-powered meal plan generator (3/7/14 days)
- 🛒 Shopping list generator from meal plans
- 🌐 Restaurant finder with diabetes-friendly recommendations

### User Experience
- 🌍 Bilingual support (English/Spanish)
- 🎨 Modern, accessible UI with loading skeletons
- ⚡ React Query for optimized data caching
- 🏅 Achievement system with badges and rewards
- 📱 Mobile-responsive design

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + TailwindCSS
- **Backend:** Next.js API routes
- **Database:** Neon Postgres (free tier)
- **ORM:** Prisma
- **Auth:** NextAuth.js with Google OAuth
- **AI:** Anthropic Claude 3.5 Sonnet
- **Email:** Nodemailer (SMTP)
- **State Management:** React Query (TanStack Query)
- **Data Visualization:** Recharts
- **Export:** jsPDF, PapaCSV
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

## Development Status

- [x] Core setup (Next.js + Prisma + Auth)
- [x] Onboarding flow with profile setup
- [x] Home dashboard with quick actions
- [x] Meal logging with photo upload
- [x] AI-powered meal analysis (Claude 3.5 Sonnet)
- [x] Glucose tracking with manual entry
- [x] Comprehensive analytics & insights
- [x] Pattern detection and A1C estimation
- [x] Data export (PDF/CSV)
- [x] Weekly email reports
- [x] AI-powered meal plan generator
- [x] Shopping list generator
- [x] Restaurant finder with recommendations
- [x] Achievement system with badges
- [x] Bilingual support (English/Spanish)
- [x] React Query data caching
- [x] Loading skeletons for better UX
- [x] ARIA accessibility improvements
- [ ] Chat assistant (planned)
- [ ] Menu scanning (planned)

## License

MIT

## Support

For questions or issues, please open a GitHub issue.

---

Built with ❤️ for the diabetes community
