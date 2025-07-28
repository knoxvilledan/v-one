# Test User Login Credentials

## 📧 Test Users for Public Profile Testing

### 👤 Public Users (Role: public)

**Alice Smith**
- Email: `alice.smith@example.com`
- Password: `test123`
- Role: Public
- Expected Experience: Sees placeholder content, can customize checklists

**Bob Johnson**
- Email: `bob.johnson@example.com`
- Password: `test123`
- Role: Public  
- Expected Experience: Sees placeholder content, independent from Alice's data

### 👑 Admin User (Role: admin)

**Carol Williams**
- Email: `carol.williams@example.com`
- Password: `admin123`
- Role: Admin
- Expected Experience: Sees admin content, access to admin panel at `/admin`

## 🧪 Testing Steps

1. **Visit:** https://www.jfn-enterprises.com/auth/signin
2. **Sign in** with any of the above credentials
3. **Test features:**
   - Public users: Customize content, see placeholders
   - Admin user: Access admin panel, switch roles, manage templates

## 🔐 Security Notes

- These are test credentials for development only
- Passwords are hashed with bcrypt in the database
- Do not use these credentials in production
- Consider changing passwords for production testing

## 🛠️ Commands to Re-run Setup

```bash
# Update test users with new passwords
node scripts/setup-test-users.js

# Verify database setup
node scripts/test-database-setup.js
```
