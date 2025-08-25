# Resend Email Service Setup Guide

This guide will help you set up Resend for sending password reset emails in your AMP Tracker application.

## 🚀 Quick Start

### 1. Create a Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key
1. Log into your Resend dashboard
2. Navigate to "API Keys" in the sidebar
3. Click "Create API Key"
4. Give it a name like "AMP Tracker"
5. Copy the generated API key

### 3. Add Domain (For Production)
1. Go to "Domains" in your Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Follow the DNS verification steps
5. Wait for verification (usually takes a few minutes)

### 4. Update Environment Variables

#### For Development (.env.local):
```bash
# Add these to your .env.local file:
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=AMP Tracker <noreply@yourdomain.com>
```

#### For Production (Vercel):
1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add the same variables:
   - `RESEND_API_KEY`: Your production API key
   - `RESEND_FROM_EMAIL`: Your verified email address

## 📧 Email Configuration

### Development Mode
- Without API key: Emails are logged to console only
- With API key: Emails are sent via Resend + logged to console

### Production Mode
- Requires valid RESEND_API_KEY
- Uses verified domain email address

## 🔧 Testing the Setup

### 1. Test in Development
```bash
# Start your development server
npm run dev

# Try the forgot password flow:
# 1. Go to http://localhost:3000/auth/signin
# 2. Click "Forgot your password?"
# 3. Enter an email address
# 4. Check console for reset URL (if no API key)
# 5. Check your email (if API key is configured)
```

### 2. Console Testing Without API Key
If you haven't set up Resend yet, you'll see output like this in your console:
```
🔐 PASSWORD RESET REQUEST
📧 Email: user@example.com
🔗 Reset URL: http://localhost:3000/auth/reset-password?token=abc123...
⏰ Valid for 15 minutes
💡 To send actual emails, add RESEND_API_KEY to your .env.local file
```

### 3. Production Testing
1. Deploy to Vercel with environment variables
2. Test forgot password with a real email
3. Check Resend dashboard for delivery status

## 🎨 Email Template Features

The password reset emails include:
- ✅ Professional HTML design
- ✅ Mobile-responsive layout
- ✅ Clear call-to-action button
- ✅ Fallback text link
- ✅ 15-minute expiry notice
- ✅ Security notice for unwanted requests

## 🔒 Security Features

- **Token Expiry**: Reset tokens expire after 15 minutes
- **One-time Use**: Tokens are deleted after successful password reset
- **Secure Generation**: Uses Node.js crypto.randomBytes()
- **Database Cleanup**: Expired tokens are automatically handled

## 📊 Resend Pricing

### Free Tier (Perfect for Development)
- 3,000 emails per month
- All features included
- No credit card required

### Paid Plans (For Production)
- $20/month for 50,000 emails
- $80/month for 500,000 emails
- Custom pricing for higher volumes

## 🛠️ Troubleshooting

### Common Issues

#### 1. API Key Invalid
```
Error: Failed to send email: Invalid API key
```
**Solution**: Double-check your API key in Resend dashboard and .env.local

#### 2. Domain Not Verified
```
Error: Failed to send email: Domain not verified
```
**Solution**: 
- For development: Use any email address temporarily
- For production: Verify your domain in Resend dashboard

#### 3. From Email Not Allowed
```
Error: Failed to send email: From email not allowed
```
**Solution**: Use a verified domain email or the default Resend email for testing

### Debug Steps
1. Check console logs for detailed error messages
2. Verify environment variables are loaded correctly
3. Test API key in Resend dashboard
4. Check Resend logs for delivery status

## 🚀 Going Live Checklist

- [ ] Resend account created
- [ ] API key generated and added to production environment
- [ ] Domain verified in Resend
- [ ] From email address configured with verified domain
- [ ] Test email sent successfully
- [ ] Reset password flow tested end-to-end

## 📞 Support

- **Resend Documentation**: [docs.resend.com](https://docs.resend.com)
- **Resend Support**: Available in their dashboard
- **AMP Tracker Issues**: Check console logs and contact your development team

---

*This setup provides professional, reliable email delivery for your password reset feature. The beautiful HTML emails will enhance your users' experience and build trust in your application.*
