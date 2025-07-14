# AMP Tracker - MongoDB Atlas Deployment Guide

## Prerequisites

1. MongoDB Atlas account
2. Vercel account (or your preferred hosting platform)

## MongoDB Atlas Setup

### 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (free tier works for beta)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)

### 2. Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password

### 3. Environment Variables

Create a `.env.local` file with:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/amp-tracker?retryWrites=true&w=majority
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-a-strong-one
```

For production, generate a secure secret:

```bash
openssl rand -base64 32
```

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Test the Application

- Visit `http://localhost:3000`
- Create an account at `/auth/signup`
- Sign in at `/auth/signin`
- Test the AMP Tracker functionality

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Add MongoDB Atlas integration"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. Add environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `NEXTAUTH_URL`: Your production URL (e.g., https://your-app.vercel.app)
   - `NEXTAUTH_SECRET`: A secure random string

### 3. Deploy

- Vercel will automatically build and deploy your app
- Test the deployed version with user registration and login

## Database Schema

The application will automatically create these collections:

- `users`: User accounts
- `accounts`: NextAuth account data
- `sessions`: User sessions
- `user_data`: Daily tracking data

## Features Added

### Authentication

- User registration and login
- Session management with NextAuth
- Password hashing with bcrypt

### Data Storage

- MongoDB Atlas integration
- User-specific data isolation
- Date-based data organization

### API Endpoints

- `POST /api/register`: User registration
- `POST /api/user-data`: Save daily data
- `GET /api/user-data`: Load daily data

## Beta Testing

For your beta testing:

1. Deploy to Vercel (free tier)
2. Share the URL with beta testers
3. Users can create accounts and track their daily progress
4. Data is automatically saved to MongoDB Atlas

## Security Notes

- Passwords are hashed with bcrypt
- User data is isolated by user ID
- MongoDB connection uses SSL/TLS
- NextAuth handles session security

## Next Steps

1. Test locally first
2. Deploy to Vercel
3. Create your account
4. Invite beta testers
5. Monitor MongoDB Atlas for usage

The application is now ready for beta deployment with user accounts and cloud storage!
