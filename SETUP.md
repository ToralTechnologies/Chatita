# Chatita Setup Guide

## Current Status

✅ **Completed:**
- Phase 1: Next.js 16 + TypeScript + TailwindCSS + Prisma
- Phase 2: Authentication (NextAuth), Onboarding Flow, Home Dashboard

🚧 **In Progress:**
- Phase 3: Meal logging with photo upload

📋 **To Do:**
- Phase 4: Menu scanner
- Phase 5: Insights & rewards
- Phase 6: Chat assistant
- Phase 7: Internationalization

---

## Quick Start

### 1. Database Setup (Required)

You need a PostgreSQL database. The easiest free option is **Neon**:

1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Update `.env` file:

```bash
DATABASE_URL="postgresql://user:password@host.region.neon.tech/chatita?sslmode=require"
```

### 2. Environment Setup

Generate a secure NextAuth secret:

```bash
openssl rand -base64 32
```

Update `.env` with the generated secret:

```bash
NEXTAUTH_SECRET="your-generated-secret-here"
```

### 3. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Seed initial data (badges)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## What You Can Do Now

### Working Features:

1. **User Registration & Login**
   - Go to http://localhost:3000
   - You'll be redirected to `/login`
   - Click "Sign up" to create an account
   - Login with your credentials

2. **Onboarding Flow**
   - After registration, you'll see the welcome screen
   - Navigate through 3 onboarding screens:
     - Welcome
     - How Chatita Helps
     - Profile Setup (diabetes type, glucose range)

3. **Home Dashboard**
   - Personalized greeting
   - Glucose tracking widget (manual entry)
   - Mood selector (sad/neutral/happy)
   - Stress level slider (1-10)
   - Context tags:
     - Not feeling well 🤒
     - On my period 🩸
     - Feeling overwhelmed 😰
     - Having cravings 🍫

4. **Bottom Navigation**
   - Home, Add Meal, Insights, Rewards, Settings
   - Routes exist but show "Coming soon" placeholders

5. **Settings**
   - Language toggle (Spanish coming soon)
   - Sign out

---

## Project Structure

```
chatita/
├── app/
│   ├── (auth)/              # Login & Register pages
│   │   ├── login/
│   │   └── register/
│   ├── (onboarding)/        # Onboarding flow
│   │   └── onboarding/
│   │       ├── welcome/
│   │       ├── how-it-helps/
│   │       └── profile-setup/
│   ├── (main)/              # Main app (requires auth)
│   │   ├── home/            ✅ Complete
│   │   ├── add-meal/        🚧 Placeholder
│   │   ├── meal-history/    🚧 Placeholder
│   │   ├── menu-scanner/    🚧 Placeholder
│   │   ├── insights/        🚧 Placeholder
│   │   ├── rewards/         🚧 Placeholder
│   │   └── settings/        ✅ Complete
│   ├── api/                 # API routes
│   │   ├── auth/            ✅ NextAuth
│   │   ├── register/        ✅ User registration
│   │   ├── user/profile/    ✅ User profile
│   │   ├── glucose/         ✅ Glucose tracking
│   │   └── mood/            ✅ Mood & context
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Root redirect
├── components/
│   ├── bottom-nav.tsx       ✅
│   ├── glucose-widget.tsx   ✅
│   ├── mood-selector.tsx    ✅
│   └── context-tags.tsx     ✅
├── lib/
│   ├── prisma.ts           # Prisma client
│   └── auth.ts             # NextAuth config
├── prisma/
│   ├── schema.prisma       ✅ Complete schema
│   └── seed.ts             ✅ Badge seeding
├── types/
│   ├── index.ts            # TypeScript types
│   └── next-auth.d.ts      # NextAuth types
└── package.json
```

---

## Database Schema

### Models Created:

1. **User** - Authentication & profile
   - email, password, name
   - diabetesType, targetGlucoseMin/Max
   - preferredLanguage

2. **Meal** - Meal logging
   - photoUrl/photoBase64
   - detectedFoods (JSON)
   - nutrition data (calories, carbs, etc.)
   - feeling, mealType

3. **GlucoseEntry** - Blood sugar tracking
   - value (mg/dL)
   - notes, measuredAt

4. **MoodEntry** - Mood & context tracking
   - mood (sad/neutral/happy)
   - stressLevel (1-10)
   - Context flags: notFeelingWell, onPeriod, feelingOverwhelmed, havingCravings

5. **ChatMessage** - Chat history
   - role (user/assistant)
   - content, userContext

6. **Badge** - Achievement definitions
   - name, nameEs (Spanish)
   - description, icon, daysRequired

7. **UserBadge** - Unlocked achievements
   - userId, badgeId, unlockedAt

---

## Next Steps

### Phase 3: Meal Logging (Next Priority)

Create:
1. Photo upload component (`$0 mode`: base64 storage)
2. Manual food selection interface
3. Nutrition entry form
4. Meal card component
5. API endpoint `/api/meals`

Files to create:
- `app/(main)/add-meal/page.tsx` - Replace placeholder
- `components/meal-photo-upload.tsx`
- `components/meal-form.tsx`
- `app/api/meals/route.ts`
- `app/api/meals/[id]/route.ts`

### Phase 4: Meal History

Create:
- Meal list view
- Search & filter
- Grouped by date
- Edit/delete actions

### Phase 5: Menu Scanner

Create:
- Photo upload for menus
- Rules-based scoring ($0 mode)
- Recommendation cards with tips

### Phase 6: Insights

Create:
- Weekly stats calculation
- Pattern detection heuristics
- Insight cards

### Phase 7: Rewards

Create:
- Badge unlocking logic
- Streak tracking
- Milestone progress

### Phase 8: Chat Assistant

Create:
- Chat UI component
- Template-based responses ($0 mode)
- Context-aware suggestions

### Phase 9: Internationalization

Create:
- `i18n/en.json`
- `i18n/es.json`
- Translation hook
- Update all components

---

## Cost Tracking

### Current Stack (All FREE):

- **Hosting**: Vercel (unlimited for hobby)
- **Database**: Neon Postgres (0.5 GB free)
- **Auth**: NextAuth (self-hosted)
- **Storage**: Base64 in DB (for MVP)
- **AI**: Disabled (feature flags off)

**Monthly Cost: $0** ✅

### Optional AI Features (Disabled by Default):

If you enable AI features in `.env`:
- `ENABLE_AI_ANALYSIS=true` - Claude 3.5 Sonnet vision (~$3-5/month)
- `ENABLE_AI_CHAT=true` - Claude 3.5 Sonnet chat (~$2-4/month)

**With AI: ~$5-9/month**

---

## Deployment to Vercel

### One-time Setup:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Environment Variables in Vercel:

1. Go to your project dashboard
2. Settings → Environment Variables
3. Add:
   - `DATABASE_URL` - Your Neon connection string
   - `NEXTAUTH_SECRET` - Generate new one for production
   - `NEXTAUTH_URL` - Your Vercel domain (e.g., https://chatita.vercel.app)

### Deploy:

```bash
vercel --prod
```

---

## Troubleshooting

### "Cannot find module @prisma/client"
```bash
npm run db:generate
```

### Database connection error
- Check `DATABASE_URL` in `.env`
- Ensure your Neon database is active
- Try pinging the host

### Build fails
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Session not persisting
- Check `NEXTAUTH_SECRET` is set
- Make sure cookies are enabled in browser

---

## Testing

### Create a test user:

1. Go to http://localhost:3000
2. Click "Sign up"
3. Enter:
   - Email: test@chatita.com
   - Password: password123
   - Name: Test User
4. Complete onboarding:
   - Select "Type 2" diabetes
   - Keep default glucose range (70-180)
5. Explore home dashboard:
   - Add a glucose reading
   - Select a mood
   - Toggle context tags

---

## Development Tips

### Run Prisma Studio (Database GUI):

```bash
npm run db:studio
```

Opens at http://localhost:5555

### Watch logs:

```bash
npm run dev
```

### Update database schema:

1. Edit `prisma/schema.prisma`
2. Run:
```bash
npm run db:migrate
```

---

## Design System

### Colors (Tailwind):

- **Primary**: `bg-primary` (#4A90E2) - Blue
- **Success**: `bg-success` (#7ED321) - Green
- **Warning**: `bg-warning` (#F5A623) - Yellow
- **Danger**: `bg-danger` (#D0021B) - Red
- **Gray Background**: `bg-gray-background` (#F5F5F7)

### Components:

- **Card**: `rounded-card` (12px) + `shadow-card`
- **Button**: `rounded-button` (24px)
- **Touch targets**: Min 44×44px

---

## Security Notes

### Implemented:

✅ Password hashing (bcrypt)
✅ Session management (JWT)
✅ SQL injection protection (Prisma)
✅ CSRF protection (NextAuth)

### To Add Later:

- [ ] Email verification
- [ ] Password reset flow
- [ ] Rate limiting
- [ ] Input validation (Zod)

---

## Contact

For issues or questions:
- Check this guide first
- Review the master prompt document
- Test in Prisma Studio
- Check browser console for errors

---

Built with ❤️ for the diabetes community
