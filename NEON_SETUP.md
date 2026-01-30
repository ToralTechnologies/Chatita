# Neon Database Setup Guide

Follow these steps to create your free PostgreSQL database for Chatita.

---

## Step 1: Create Neon Account

1. Open your browser and go to: **https://neon.tech**

2. Click the **"Sign Up"** button (top right)

3. Sign up using one of these options:
   - **GitHub** (easiest - click "Continue with GitHub")
   - **Google** (click "Continue with Google")
   - **Email** (enter your email and create a password)

4. If using GitHub/Google, authorize the connection when prompted

---

## Step 2: Create Your First Project

After signing in, you'll see the Neon dashboard.

1. Click **"Create a project"** or **"New Project"** button

2. Fill in the project details:
   - **Project name**: `chatita` (or any name you like)
   - **Region**: Choose the one closest to you:
     - If in US East: `US East (Ohio)`
     - If in US West: `US West (Oregon)`
     - If in Europe: `Europe (Frankfurt)`
     - If in Asia: `Asia Pacific (Singapore)`
   - **Postgres version**: Leave as default (latest version)

3. Click **"Create Project"**

   *Wait a few seconds while Neon creates your database...*

---

## Step 3: Get Your Connection String

Once the project is created, you'll see the project dashboard.

1. Look for a section called **"Connection Details"** or **"Connection String"**

2. You'll see a dropdown that says **"Connection string"**

3. Make sure it shows **"Pooled connection"** or **"Direct connection"** (either works)

4. You should see a long string that looks like this:

   ```
   postgresql://alex:AbC123xyz@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

5. **Click the "Copy" button** next to the connection string (📋 icon)

   ⚠️ **IMPORTANT**: This contains your password! Keep it secure.

---

## Step 4: What the Connection String Looks Like

Your connection string will have this format:

```
postgresql://USERNAME:PASSWORD@ENDPOINT/DATABASE?sslmode=require
```

Example:
```
postgresql://chatita_owner:npg_AbCdEfGh12345@ep-shiny-cloud-a1b2c3d4.us-east-2.aws.neon.tech/chatita?sslmode=require
```

Parts breakdown:
- `chatita_owner` = your username
- `npg_AbCdEfGh12345` = your password (auto-generated)
- `ep-shiny-cloud-a1b2c3d4.us-east-2.aws.neon.tech` = your database host
- `chatita` = your database name
- `?sslmode=require` = security setting

---

## Step 5: Save the Connection String

Once you've copied the connection string:

1. **Paste it somewhere safe temporarily** (like a text file)

2. **Tell me in the chat**: "I have the connection string"

3. I'll update your `.env` file with it automatically

---

## Troubleshooting

### Can't find the connection string?

1. In Neon dashboard, click on your project name (`chatita`)
2. Look for the **"Dashboard"** tab (should be selected by default)
3. Scroll down to find **"Connection Details"** section
4. If you see multiple tabs, try clicking **"Connection string"**

### Connection string not showing?

1. Make sure your project finished creating (check for a green checkmark)
2. Refresh the page
3. Click on the database name in the left sidebar

### Need to see your connection string again later?

1. Go to https://console.neon.tech
2. Click on your project (`chatita`)
3. The connection string is always visible on the Dashboard page

---

## Security Note

🔒 **Never share your connection string publicly!**

- It contains your database password
- Anyone with it can access your database
- We've added it to `.gitignore` so it won't be committed to Git

---

## What Happens Next

After you give me the connection string:

1. ✅ I'll update your `.env` file
2. ✅ I'll run database migrations (create tables)
3. ✅ I'll seed initial data (badges)
4. ✅ I'll start the development server
5. ✅ You'll be able to use Chatita!

---

## Ready?

Once you have the connection string copied, just paste it in the chat and say:

**"Here's my connection string: postgresql://..."**

Or just type: **"Done"** and paste the string.

I'll take it from there! 🚀
