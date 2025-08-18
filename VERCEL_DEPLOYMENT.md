# Vercel Production Deployment Guide

## 🚀 Environment Variables for Vercel

You need to configure these environment variables in your Vercel dashboard:

### 📋 Required Environment Variables:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://knoxvilledan2:AAAWWW333mmm@cluster1.fc7watg.mongodb.net/AmpTrack?retryWrites=true&w=majority&appName=Cluster1

# NextAuth Configuration  
NEXTAUTH_URL=https://www.jfm-enterprises.com
NEXTAUTH_SECRET=eEMKYPqbdoB30ODUnnyAKYYe+UqPCB8xj60cXUvADIZU=

# Google OAuth Configuration
GOOGLE_CLIENT_ID=388177290405-ohdf2qthc0e0bg5mh63ks3g5mb6bh35i.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

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
- **Cluster**: cluster1.fc7watg.mongodb.net  
- **Database**: AmpTrack
- **User**: knoxvilledan2

## 🔐 Security Notes:

- Environment variables are properly configured
- Google OAuth domains should include your production domain
- NEXTAUTH_SECRET is properly generated

## ⚡ Quick Deploy Command:

```bash
# Complete deployment in one command
git add . && git commit -m "Deploy remaining count fixes" && git push origin master
```
