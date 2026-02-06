# Chatita Deployment Guide

This guide covers deploying Chatita to Vercel with all necessary services configured.

## Prerequisites

- Vercel account
- PostgreSQL database (Vercel Postgres, Supabase, or similar)
- Google OAuth credentials (for authentication)
- SMTP credentials (for weekly reports)

## Environment Variables

Create a `.env.production` file or configure these in Vercel Dashboard:

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="generate-random-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM='"Chatita" <noreply@chatita.app>'

# Cron Job Security
CRON_SECRET="generate-random-secret-for-cron"

# App URL
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"

# OpenAI (Optional - for AI features)
OPENAI_API_KEY="sk-..."
```

## Step-by-Step Deployment

### 1. Set up Database

#### Option A: Vercel Postgres

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Create postgres database
vercel postgres create

# Copy DATABASE_URL from Vercel dashboard
```

#### Option B: Supabase

1. Create project at https://supabase.com
2. Get connection string from Settings > Database
3. Add to environment variables

### 2. Run Database Migrations

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Authorized JavaScript origins**: `https://your-domain.vercel.app`
   - **Authorized redirect URIs**: `https://your-domain.vercel.app/api/auth/callback/google`
5. Copy Client ID and Client Secret to environment variables

### 4. Set up Email (Gmail Example)

1. Go to [Google Account Settings](https://myaccount.google.com)
2. Security > 2-Step Verification (enable if not enabled)
3. App Passwords > Generate new app password
4. Use generated password as `SMTP_PASS`

### 5. Deploy to Vercel

```bash
# Deploy
vercel --prod

# Or push to GitHub and let Vercel auto-deploy
git push origin main
```

### 6. Configure Vercel Cron Jobs

The `vercel.json` file already includes cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-reports",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

This runs every Monday at 9 AM UTC. To change:
- `"0 8 * * 1"` - Monday 8 AM
- `"0 9 * * 0"` - Sunday 9 AM
- `"0 9 * * 5"` - Friday 9 AM

### 7. Configure Cron Authentication

In Vercel Dashboard:
1. Go to Settings > Environment Variables
2. Add `CRON_SECRET` with a random secret value
3. Redeploy the project

### 8. Post-Deployment Checklist

- [ ] Test Google Sign In
- [ ] Create test user account
- [ ] Log sample meals
- [ ] Verify analytics display
- [ ] Test PDF/CSV export
- [ ] Send test weekly report (POST `/api/reports/weekly`)
- [ ] Verify database connections
- [ ] Check error logs in Vercel Dashboard

## Database Seeding (Optional)

To populate with sample data:

```bash
# Create seed script
npm run seed

# Or manually via Prisma Studio
npx prisma studio
```

## Monitoring

### Vercel Analytics

Enable in Vercel Dashboard > Analytics

### Error Tracking

Consider adding Sentry:

```bash
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs
```

### Logs

View logs in Vercel Dashboard:
- Runtime Logs
- Build Logs
- Edge Logs

## Performance Optimization

### 1. Enable Edge Runtime (where applicable)

```typescript
export const runtime = 'edge';
```

### 2. Configure Next.js Image Optimization

Already configured in `next.config.js`:

```javascript
images: {
  domains: ['lh3.googleusercontent.com'],
}
```

### 3. Enable Compression

Vercel automatically compresses responses.

### 4. Database Connection Pooling

Using Prisma's connection pooling. Configure in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
vercel build --force

# Check TypeScript errors locally
npx tsc --noEmit
```

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Reset and sync
npx prisma db push --force-reset
```

### Email Not Sending

1. Verify SMTP credentials
2. Check firewall/security settings
3. Test with `/api/reports/weekly` endpoint
4. Review Vercel function logs

### OAuth Errors

1. Verify redirect URIs match exactly
2. Check `NEXTAUTH_URL` is correct
3. Ensure `NEXTAUTH_SECRET` is set
4. Clear browser cookies and retry

## Scaling Considerations

### Database

- Start with Vercel Postgres (Free tier: 256 MB)
- Upgrade to Pro (60 GB) as needed
- Consider connection pooling with PgBouncer

### API Routes

- Vercel Hobby: 100 GB-hours compute
- Vercel Pro: 1000 GB-hours compute
- Optimize with React Query caching

### Storage

If storing meal photos:
- Use Vercel Blob Storage
- Or integrate with Cloudinary/AWS S3

## Maintenance

### Regular Tasks

```bash
# Update dependencies monthly
npm update

# Check for security vulnerabilities
npm audit

# Backup database weekly
pg_dump DATABASE_URL > backup.sql
```

### Database Migrations

When schema changes:

```bash
# Create migration
npx prisma migrate dev --name description

# Apply to production
npx prisma migrate deploy
```

## Custom Domain

1. Go to Vercel Dashboard > Domains
2. Add your custom domain
3. Configure DNS records:
   - Type: `A`, Name: `@`, Value: `76.76.21.21`
   - Type: `CNAME`, Name: `www`, Value: `cname.vercel-dns.com`
4. Update `NEXTAUTH_URL` and Google OAuth redirect URIs

## Security Best Practices

1. **Never commit** `.env` files
2. **Rotate secrets** periodically
3. **Enable** CORS restrictions
4. **Use** rate limiting for API routes
5. **Implement** CSP headers
6. **Keep** dependencies updated

## Support

For issues:
- Check Vercel logs
- Review Next.js documentation
- Check Prisma documentation
- Verify environment variables

## Rollback

If deployment fails:

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```
