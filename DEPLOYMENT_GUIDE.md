# 🚀 Chatita Deployment Guide

## Complete Step-by-Step Guide to Deploy Chatita Online

This guide will walk you through deploying Chatita to **Vercel** (recommended and free) with your existing **Neon PostgreSQL** database.

---

## Prerequisites ✅

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Neon database (you already have this)
- ✅ Vercel account (free - we'll create if needed)
- ✅ Working local Chatita instance

---

## Part 1: Prepare Your Code for Deployment

### Step 1: Commit Your Code to Git

```bash
# Navigate to your project directory
cd /Users/lucerotoral/ChatitaWebApp

# Check git status
git status

# Add all files
git add .

# Commit with a message
git commit -m "Add email allowlist access control and prepare for deployment"

# Push to GitHub
git push origin main
```

**If you haven't set up a GitHub repository yet:**

1. Go to https://github.com/new
2. Create a new repository called `chatita-webapp` (or any name)
3. **DON'T** initialize with README (you already have files)
4. Copy the repository URL (e.g., `https://github.com/torallify/chatita-webapp.git`)
5. Run these commands:

```bash
# Add remote (replace with YOUR repository URL)
git remote add origin https://github.com/torallify/chatita-webapp.git

# Push to GitHub
git push -u origin main
```

---

## Part 2: Deploy to Vercel

### Step 1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub

### Step 2: Import Your Repository

1. Once logged in, click **"Add New..."** → **"Project"**
2. Find your `chatita-webapp` repository in the list
3. Click **"Import"**

### Step 3: Configure Build Settings

Vercel will auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js ✅ (auto-detected)
- **Root Directory**: `./` (leave as is)
- **Build Command**: `npm run build` ✅ (auto-detected)
- **Output Directory**: `.next` ✅ (auto-detected)
- **Install Command**: `npm install` ✅ (auto-detected)

**Important**: Click **"Environment Variables"** before deploying!

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add each of these:

#### Required Variables:

1. **DATABASE_URL**
   ```
   Name: DATABASE_URL
   Value: [Copy from your .env file - starts with postgresql://]
   ```
   *(Use your existing Neon connection string from `.env`)*

2. **NEXTAUTH_SECRET**
   ```
   Name: NEXTAUTH_SECRET
   Value: [Generate a NEW secret - see below]
   ```

   **Generate new secret:**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste as the value.

3. **NEXTAUTH_URL**
   ```
   Name: NEXTAUTH_URL
   Value: [Leave empty for now - we'll add this after deployment]
   ```

4. **ALLOWED_EMAILS**
   ```
   Name: ALLOWED_EMAILS
   Value: torall@umich.edu
   ```
   *(Add more emails separated by commas if needed)*

#### Optional Variables (for AI features):

5. **ANTHROPIC_API_KEY**
   ```
   Name: ANTHROPIC_API_KEY
   Value: [Copy from your .env file - starts with sk-ant-]
   ```
   *(Use your existing Claude API key from `.env`)*

6. **ENABLE_AI_ANALYSIS**
   ```
   Name: ENABLE_AI_ANALYSIS
   Value: true
   ```

7. **ENABLE_AI_CHAT**
   ```
   Name: ENABLE_AI_CHAT
   Value: true
   ```

8. **ENABLE_GOOGLE_PLACES**
   ```
   Name: ENABLE_GOOGLE_PLACES
   Value: false
   ```

### Step 5: Deploy!

1. After adding all environment variables, click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll see "Congratulations!" when it's done
4. You'll get a URL like: `https://chatita-webapp.vercel.app` or `https://chatita-webapp-xyz123.vercel.app`

---

## Part 3: Post-Deployment Configuration

### Step 1: Update NEXTAUTH_URL

1. Copy your new Vercel URL (e.g., `https://chatita-webapp.vercel.app`)
2. Go to your Vercel project dashboard
3. Click **"Settings"** → **"Environment Variables"**
4. Find `NEXTAUTH_URL` (it should be empty)
5. Click **"Edit"**
6. Set value to your Vercel URL: `https://chatita-webapp.vercel.app`
7. Click **"Save"**
8. Click **"Redeploy"** → **"Redeploy"** (in the Deployments tab)

### Step 2: Test Your Deployment

1. Visit your Vercel URL: `https://chatita-webapp.vercel.app`
2. Try to register with your authorized email: `torall@umich.edu`
3. Complete onboarding
4. Test all features:
   - ✅ Glucose tracking
   - ✅ Meal logging
   - ✅ Restaurant finder
   - ✅ Insights
   - ✅ Rewards
   - ✅ Chat

### Step 3: Verify Access Control

**Test unauthorized access:**

1. Open an incognito/private window
2. Try to register with a random email (e.g., `test@example.com`)
3. You should see **"This email is not authorized to sign up for Chatita"** ✅

**If access control is working, you're done!** 🎉

---

## Part 4: Custom Domain (Optional)

If you want to use your own domain (e.g., `chatita.com`):

### Step 1: Purchase Domain

- Buy from: Namecheap, GoDaddy, Google Domains, etc.

### Step 2: Add Domain to Vercel

1. Go to your Vercel project
2. Click **"Settings"** → **"Domains"**
3. Enter your domain (e.g., `chatita.com`)
4. Click **"Add"**
5. Vercel will show DNS records you need to add

### Step 3: Configure DNS

1. Go to your domain registrar's DNS settings
2. Add the DNS records Vercel provided (usually A/CNAME records)
3. Wait 10-60 minutes for DNS propagation

### Step 4: Update NEXTAUTH_URL

1. Go to **"Settings"** → **"Environment Variables"**
2. Edit `NEXTAUTH_URL`
3. Change to: `https://chatita.com` (your domain)
4. Save and redeploy

---

## Part 5: Google OAuth Setup (Optional)

If you want "Sign in with Google":

### Step 1: Create Google OAuth App

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Navigate to **"APIs & Services"** → **"Credentials"**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. Select **"Web application"**
6. Add authorized redirect URIs:
   - `https://chatita-webapp.vercel.app/api/auth/callback/google`
   - Or your custom domain: `https://chatita.com/api/auth/callback/google`
7. Click **"Create"**
8. Copy the **Client ID** and **Client Secret**

### Step 2: Add to Vercel Environment Variables

1. Go to Vercel project → **"Settings"** → **"Environment Variables"**
2. Add:
   ```
   Name: GOOGLE_CLIENT_ID
   Value: [Your Client ID from Google]
   ```
3. Add:
   ```
   Name: GOOGLE_CLIENT_SECRET
   Value: [Your Client Secret from Google]
   ```
4. Click **"Save"**
5. Redeploy

Now users can sign in with Google! (Still requires email to be in `ALLOWED_EMAILS`)

---

## Part 6: Managing Users

### Add New User

1. Go to Vercel project → **"Settings"** → **"Environment Variables"**
2. Find `ALLOWED_EMAILS`
3. Click **"Edit"**
4. Add new email: `torall@umich.edu,newuser@example.com`
5. Click **"Save"**
6. Click **"Redeploy"** (in Deployments tab)
7. New user can now register!

### Remove User

1. Go to Vercel → **"Settings"** → **"Environment Variables"**
2. Find `ALLOWED_EMAILS`
3. Click **"Edit"**
4. Remove email from the list
5. Click **"Save"**
6. Redeploy
7. User loses access immediately

---

## Troubleshooting

### Issue: Build fails with "Prisma Client not generated"

**Solution:**
Add this to `package.json` scripts:
```json
"postinstall": "prisma generate"
```

Then commit and push:
```bash
git add package.json
git commit -m "Add Prisma postinstall script"
git push origin main
```

Vercel will auto-redeploy.

### Issue: Database connection error

**Solution:**
1. Check `DATABASE_URL` in Vercel environment variables
2. Ensure it matches your Neon connection string
3. Verify Neon database is active (check Neon dashboard)
4. Redeploy

### Issue: "Invalid or missing NEXTAUTH_SECRET"

**Solution:**
1. Generate new secret: `openssl rand -base64 32`
2. Update `NEXTAUTH_SECRET` in Vercel
3. Redeploy

### Issue: Session not persisting

**Solution:**
1. Verify `NEXTAUTH_URL` matches your deployed URL exactly
2. Must include `https://` (not `http://`)
3. No trailing slash
4. Example: `https://chatita-webapp.vercel.app` ✅
5. Wrong: `http://chatita-webapp.vercel.app` ❌
6. Wrong: `https://chatita-webapp.vercel.app/` ❌

### Issue: Access control not working

**Solution:**
1. Check `ALLOWED_EMAILS` is set in Vercel
2. Ensure emails are comma-separated (no spaces)
3. Check browser console for errors
4. Try clearing cookies and cache

### Issue: AI features not working

**Solution:**
1. Verify `ANTHROPIC_API_KEY` is set correctly
2. Check `ENABLE_AI_ANALYSIS` and `ENABLE_AI_CHAT` are `true`
3. Check Claude API quota at https://console.anthropic.com/
4. Verify API key is valid and has not expired

---

## Monitoring Your Deployment

### View Logs

1. Go to Vercel project
2. Click **"Deployments"**
3. Click on latest deployment
4. Click **"Functions"** to see logs
5. Filter by function to see specific logs

### Analytics

1. Go to Vercel project
2. Click **"Analytics"**
3. View:
   - Page views
   - Performance metrics
   - Top pages
   - User geography

### Error Tracking

Vercel automatically tracks errors. View them in:
- **"Functions"** tab → Filter by "Error"

---

## Cost Breakdown

### Free Tier (Current Setup):

- ✅ **Vercel Hosting**: Free (Hobby plan)
  - Unlimited deployments
  - Automatic HTTPS
  - Global CDN
  - 100GB bandwidth/month

- ✅ **Neon Database**: Free
  - 0.5 GB storage
  - Always-on compute
  - Unlimited queries

- ✅ **NextAuth**: Free (self-hosted)

### Paid Services (Optional):

- **Claude AI**: ~$3-5/month (if AI enabled)
- **Google OAuth**: Free
- **Custom Domain**: $10-15/year (if purchased)

**Total Monthly Cost**: $0 (or $3-5 with AI) 💰

---

## Production Checklist

Before going fully live, ensure:

- [ ] `NEXTAUTH_SECRET` is unique (not from local `.env`)
- [ ] `NEXTAUTH_URL` matches your deployed URL
- [ ] `ALLOWED_EMAILS` contains correct authorized emails
- [ ] Database migrations applied (`prisma migrate deploy`)
- [ ] All features tested on production
- [ ] Access control tested (unauthorized email blocked)
- [ ] Custom domain configured (if using)
- [ ] Google OAuth configured (if using)
- [ ] Analytics enabled in Vercel
- [ ] Error tracking verified

---

## Updating Your Deployment

### Method 1: Push to GitHub (Automatic)

```bash
# Make changes locally
# Test locally: npm run dev

# Commit changes
git add .
git commit -m "Your update message"

# Push to GitHub
git push origin main

# Vercel automatically deploys! 🎉
```

### Method 2: Manual Redeploy

1. Go to Vercel project
2. Click **"Deployments"**
3. Click **"Redeploy"** on any deployment
4. Click **"Redeploy"**

---

## Rollback to Previous Version

If something breaks:

1. Go to Vercel → **"Deployments"**
2. Find a working deployment
3. Click **"⋯"** (three dots)
4. Click **"Promote to Production"**
5. Your site is restored! ✅

---

## Security Best Practices

### ✅ Already Implemented

- Email allowlist access control
- Password hashing (bcrypt, 12 rounds)
- CSRF protection (NextAuth)
- HTTP-only cookies
- Session validation
- SQL injection protection (Prisma)

### 🔒 Additional Recommendations

1. **Rate Limiting** (Future)
   - Add to prevent brute force attacks
   - Use Vercel Edge Middleware or Upstash Rate Limit

2. **Email Verification** (Future)
   - Verify email ownership
   - Use SendGrid or Resend for emails

3. **2FA** (Future)
   - Add two-factor authentication
   - Use authenticator apps

4. **Audit Logging** (Future)
   - Log all user actions
   - Store in database

---

## Support

### Need Help?

1. **Vercel Documentation**: https://vercel.com/docs
2. **Next.js Documentation**: https://nextjs.org/docs
3. **Neon Documentation**: https://neon.tech/docs
4. **NextAuth Documentation**: https://next-auth.js.org/

### Common Issues

- **Build fails**: Check Vercel build logs
- **Database errors**: Check Neon dashboard
- **Auth issues**: Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- **Environment variables**: Must be set in Vercel, not `.env`

---

## Summary: Exact Steps

### Quick Checklist

1. ✅ Commit code to GitHub
2. ✅ Create Vercel account
3. ✅ Import repository to Vercel
4. ✅ Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` (generate new)
   - `NEXTAUTH_URL` (leave empty initially)
   - `ALLOWED_EMAILS`
   - `ANTHROPIC_API_KEY` (optional)
   - `ENABLE_AI_ANALYSIS` (optional)
   - `ENABLE_AI_CHAT` (optional)
5. ✅ Click "Deploy"
6. ✅ Update `NEXTAUTH_URL` with deployed URL
7. ✅ Redeploy
8. ✅ Test your site!

**Your Chatita app is now LIVE!** 🎉

---

**Deployment Time**: ~10-15 minutes

**Difficulty**: Easy ⭐⭐☆☆☆

**Cost**: $0/month (or $3-5 with AI)

---

*Last Updated: January 30, 2026*
