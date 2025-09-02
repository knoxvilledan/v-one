# Vercel Production Deployment Guide

## 🚀 Environment Variables Setup

Configure these in your Vercel dashboard under Settings > Environment Variables:

### Required Variables:

- `MONGODB_URI` - Your MongoDB Atlas connection string
- `NEXTAUTH_URL` - Your production domain (e.g., https://your-domain.com)
- `NEXTAUTH_SECRET` - Generate at https://generate-secret.vercel.app/32
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `NEXT_PUBLIC_MAINTENANCE_MODE` - Set to "false"

## 🔧 Deployment Process

### 1. Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to Settings > Environment Variables
4. Add all required variables listed above

### 2. Deploy Changes

```bash
git add .
git commit -m "Deploy remaining count fixes"
git push origin master
```

### 3. Verify Deployment

- Check Vercel deployment logs
- Visit your production site
- Test checklist remaining counts
- Verify data saving works

## 🛠️ Post-Deployment Cleanup

⚠️ **DEPRECATED**: The specific cleanup script was removed during scripts directory cleanup.

For post-deployment verification, use the standard database tools:

```bash
npm run db:check    # Verify database structure and contents
npm run app:smoke   # Run smoke test to verify functionality
```

**Note**: One-off cleanup scripts were removed in favor of consistent database management through the `npm run db:*` aliases.

## � Troubleshooting

If you see API 400 errors:

1. Verify all environment variables are set in Vercel
2. Check deployment logs for errors
3. Ensure NEXTAUTH_URL matches your domain exactly
4. Verify MongoDB connection string is correct

## � What Gets Fixed

- ✅ Remaining count calculations
- ✅ API validation errors
- ✅ React key prop warnings
- ✅ Block ID generation
- ✅ Empty item cleanup
