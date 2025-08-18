# Vercel Production Deployment Guide

## 🚀 Environment Variables for Vercel

You need to configure these environment variables in your Vercel dashboard:

### 📋 Required Environment Variables:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net/[DATABASE]?retryWrites=true&w=majority&appName=[APPNAME]

# NextAuth Configuration  
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=[YOUR_NEXTAUTH_SECRET]

# Google OAuth Configuration
GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]

# Maintenance Mode
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

## 🔧 How to Set Vercel Environment Variables:

### Method 1: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project (`v-one` or `jfm-enterprises`)
3. Go to **Settings** > **Environment Variables**
4. Add each variable above with the values

### Method 2: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Set environment variables
vercel env add MONGODB_URI production
vercel env add NEXTAUTH_URL production  
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add NEXT_PUBLIC_MAINTENANCE_MODE production
```

## 🚀 Deployment Steps:

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Fix: API validation, remaining counts, and block IDs for production"
git push origin master
```

### 2. Deploy to Vercel
```bash
# Option A: Automatic deployment (if connected to Git)
# Vercel will auto-deploy when you push to master

# Option B: Manual deployment
vercel --prod
```

### 3. Run Production Database Cleanup
After deployment, run the cleanup script on production data:

```bash
# Create a production cleanup script
node scripts/cleanup-empty-items-prod.mjs
```

## 🔍 Verification Steps:

1. **Check Deployment**: Visit https://www.jfm-enterprises.com
2. **Test API**: Check browser console for errors
3. **Verify Counts**: Ensure remaining counts are accurate
4. **Test Saving**: Make changes and verify they persist

## 🛠️ Troubleshooting:

If you still see API 400 errors after deployment:

1. **Check Environment Variables**: Ensure all variables are set in Vercel
2. **Verify Domain**: Make sure NEXTAUTH_URL matches your domain
3. **Check Build Logs**: Look for any build-time errors
4. **Force Rebuild**: Try a fresh deployment

## 📊 Database Connection:

Your MongoDB URI is correct for production:
- **Cluster**: [YOUR_CLUSTER].mongodb.net  
- **Database**: [YOUR_DATABASE_NAME]
- **User**: [YOUR_USERNAME]

## 🔐 Security Notes:

- Environment variables are properly configured
- Google OAuth domains should include your production domain
- NEXTAUTH_SECRET is properly generated

## ⚡ Quick Deploy Command:

```bash
# Complete deployment in one command
git add . && git commit -m "Deploy remaining count fixes" && git push origin master
```
