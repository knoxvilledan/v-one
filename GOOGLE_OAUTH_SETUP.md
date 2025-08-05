# Google OAuth Setup Instructions

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://your-domain.com/api/auth/callback/google` (for production)

## Step 2: Update Environment Variables

Add your Google OAuth credentials to `.env.local`:

```bash
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

## Step 3: Test the Authentication

1. Server is running at: http://localhost:3000
2. You should see the Google OAuth test page with a "Sign in with Google" button
3. Click the button to test the OAuth flow

## Step 4: Verify Database Integration

After signing in, check your MongoDB Atlas:

### NextAuth Collections (auto-created):

- `users` - NextAuth user records
- `accounts` - OAuth provider accounts
- `sessions` - User sessions

### App Collections:

- `users` - Your app-level user records with `authUserId` linking to NextAuth

## Step 5: Promote Admin User

1. After first sign-in, update the admin promotion route with your email:
   - Edit `src/app/api/admin/promote/route.ts`
   - Replace `your-email@gmail.com` with your actual email
2. Call the endpoint: `POST http://localhost:3000/api/admin/promote`
3. Delete the promotion route after use

## Current Implementation Status

✅ MongoDB connection established
✅ NextAuth + Google OAuth configured
✅ App-level User model created with authUserId
✅ Custom registration route disabled
✅ Session Provider wrapped in layout
✅ Auth event handlers for user creation
✅ Development test interface added

## Next Steps

1. Get Google OAuth credentials from Google Cloud Console
2. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
3. Test sign-in flow at http://localhost:3000
4. Verify user creation in MongoDB
5. Promote your account to admin role
6. Remove development test interface from homepage

## Files Modified

- `src/lib/auth.ts` - Updated to use Google OAuth with user creation events
- `src/models/User.ts` - App-level user model with authUserId
- `src/lib/dbConnect.ts` - Mongoose connection helper
- `src/components/AuthButton.tsx` - OAuth test component
- `src/app/auth/signin/page.tsx` - Updated to use Google OAuth
- `src/app/auth/signup/page.tsx` - Disabled (redirects to signin)
- `src/app/api/register/route.ts` - Disabled custom registration
- `src/app/api/admin/promote/route.ts` - Admin promotion utility
- `.env.local` - Added Google OAuth variables and new secret
