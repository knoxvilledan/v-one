# Maintenance Mode Documentation

## 🚧 Current Status: Site Under Maintenance

Your AMP Tracker site is currently showing a maintenance page to all visitors.

## 🔧 How to Disable Maintenance Mode (Restore Full Site)

### Method 1: Using Environment Variables (Recommended)

1. **For local development:**
   - Open `.env.local` file
   - Change `NEXT_PUBLIC_MAINTENANCE_MODE=true` to `NEXT_PUBLIC_MAINTENANCE_MODE=false`
   - Restart your development server (`npm run dev`)

2. **For production (Vercel):**
   ```bash
   vercel env rm NEXT_PUBLIC_MAINTENANCE_MODE
   # OR
   vercel env add NEXT_PUBLIC_MAINTENANCE_MODE
   # Then enter "false" as the value
   
   # Redeploy the site
   vercel --prod
   ```

### Method 2: Code-based Toggle

Edit `src/lib/maintenance.ts`:

```typescript
// Change this line:
export const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' || process.env.NODE_ENV === 'production';

// To this:
export const MAINTENANCE_MODE = false;
```

Then deploy: `vercel --prod`

## 📁 What's Been Protected

All your original app code is completely intact:

- ✅ **Homepage** (`src/app/page.tsx`) - Original logic preserved
- ✅ **Date Pages** (`src/app/[date]/page.tsx`) - Fully functional
- ✅ **Components** - All checklist and time block components untouched
- ✅ **Database** - All user data and API routes working normally
- ✅ **Authentication** - NextAuth functionality maintained

## 🛠️ Files Added for Maintenance Mode

- `src/components/MaintenancePage.tsx` - The maintenance page component
- `src/lib/maintenance.ts` - Maintenance mode configuration
- `middleware.ts` - Route protection during maintenance
- Updated `.env.local` with maintenance flag

## 🚀 Quick Restore Commands

```bash
# 1. Disable maintenance mode
vercel env add NEXT_PUBLIC_MAINTENANCE_MODE
# Enter "false" when prompted

# 2. Redeploy
vercel --prod

# Your site will be fully functional again!
```

## 🔗 Current Deployment URLs

- **Production**: https://v-jaoc7ib8n-daniel-nelsons-projects.vercel.app
- **Custom Domain**: Check your Vercel dashboard for your configured domain

## 📞 Need Help?

The maintenance system is designed to be easily reversible. All your work is preserved and ready to be restored with a simple environment variable change.
