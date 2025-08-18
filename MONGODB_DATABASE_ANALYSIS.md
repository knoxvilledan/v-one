# 🔍 MONGODB DATABASE CONNECTION ANALYSIS

## ✅ **CURRENT DATABASE IN USE**

### 🎯 **Database Name**: `AmpTrack`

---

## 📋 **CONNECTION STRING ANALYSIS**

### Connection String

- Managed via MONGODB_URI in env (not committed). Example format:

```
mongodb+srv://<USERNAME>:<PASSWORD>@<HOST>/<DB>?retryWrites=true&w=majority
```

### **🔧 Connection String Breakdown:**

- **Protocol**: `mongodb+srv://`
- **Username**: `[USERNAME]`
- **Password**: `[PASSWORD]`
- **Host**: `[CLUSTER_HOST].mongodb.net`
- **Database**: **`AmpTrack`**
- **Options**: `retryWrites=true&w=majority&appName=[APP_NAME]`

---

## 📁 **ENVIRONMENT FILES FOUND**

### Env files

- .env.local (dev) and Vercel project env (prod) should both define MONGODB_URI pointing to AmpTrack.
  See .env.example for placeholders. No real values are committed.

### **📊 Environment Loading Priority (NextJS Default):**

1. **Development**: `.env.local` (highest priority)
2. **Production**: Vercel environment variables
3. **Fallback**: `.env` (not found in project)

---

## 🔧 **CODE CONNECTION IMPLEMENTATION**

### **📁 Connection Files:**

#### **1. /src/lib/mongodb.ts**

```typescript
const uri = process.env.MONGODB_URI;
let client = new MongoClient(uri, options);
```

- ✅ Uses environment variable
- ✅ Not hardcoded

#### **2. /src/lib/dbConnect.ts**

```typescript
const MONGODB_URI = process.env.MONGODB_URI!;
cached.promise = mongoose.connect(MONGODB_URI, opts);
```

- ✅ Uses environment variable
- ✅ Not hardcoded

#### **3. /src/lib/auth.ts**

```typescript
adapter: MongoDBAdapter(clientPromise, { databaseName: "AmpTrack" }),
```

- ✅ Explicitly specifies database name as `"AmpTrack"`
- ✅ Matches connection string database

---

## 🎯 **DATABASE USAGE SUMMARY**

### **✅ Confirmed Database**: **`AmpTrack`**

### **🔄 Connection Methods:**

1. **Mongoose** (for app data): `AmpTrack` database
2. **MongoDB Client** (for NextAuth): `AmpTrack` database
3. **MongoDBAdapter** (for auth): `AmpTrack` database explicitly set

### **🌍 Environment Usage:**

- **Development**: `.env.local` → `AmpTrack`
- **Production**: `.env.vercel` → `AmpTrack`
- **Both environments use the same database!**

---

## 🔍 **OTHER DATABASE REFERENCES**

### **❌ Not Found:**

- No references to `amptrack` (lowercase)
- No references to `amp-tracker` (with dash)
- No references to `test` database
- No hardcoded connection strings

### **✅ Consistent Usage:**

- All code uses `process.env.MONGODB_URI`
- All environments point to `AmpTrack`
- NextAuth adapter explicitly uses `AmpTrack`

---

## 🎊 **CONCLUSION**

**Your app is currently connected to the `AmpTrack` database in MongoDB Atlas.**

- ✅ **Consistent across all environments**
- ✅ **No hardcoded connections**
- ✅ **Properly configured via environment variables**
- ✅ **Same database for development and production**

**Database Name**: **`AmpTrack`** (note the capital 'A' and 'T')
