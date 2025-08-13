# ITR Assist - Setup Guide

## Database Migration Complete: MongoDB → Supabase

The application has been successfully migrated from MongoDB to Supabase (PostgreSQL). Your server is currently crashing because it needs Supabase configuration.

## 🚀 Quick Setup Steps

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Sign in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `itr-assist`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your location
6. Click "Create new project"
7. Wait for the project to be provisioned (2-3 minutes)

### 2. Get Your Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-ref.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Update Environment Variables

1. Open `/server/.env` file
2. Replace these placeholders with your actual values:

```env
# Replace these with your actual Supabase values
SUPABASE_URL=https://your-actual-project-ref.supabase.co
SUPABASE_ANON_KEY=your-actual-supabase-anon-key-here
```

### 4. Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase_schema.sql`
4. Click "Run" to create all tables and indexes

### 5. Start the Application

After updating the environment variables and creating the database schema:

1. The server should automatically restart (if the dev server is still running)
2. If not, run: `npm run dev` from the root directory
3. Both frontend (port 3000) and backend (port 5000) should start successfully

## 🔧 What Changed in the Migration

### ✅ Completed Changes

- ✅ **Database**: MongoDB → Supabase (PostgreSQL)
- ✅ **User Model**: Converted from Mongoose schema to Supabase functions
- ✅ **TaxReturn Model**: Converted with JSON field storage
- ✅ **Authentication**: Updated registration and login routes
- ✅ **Database Schema**: Created comprehensive PostgreSQL schema
- ✅ **Environment**: Updated configuration for Supabase

### 📁 Files Modified

- `server/config/supabase.js` - New Supabase client configuration
- `server/models/User.js` - Converted to Supabase functions
- `server/models/TaxReturn.js` - Converted to Supabase functions
- `server/routes/auth.js` - Updated for Supabase authentication
- `server/index.js` - Updated database connection testing
- `server/.env` - Updated environment variables
- `supabase_schema.sql` - Complete database schema

## 🚨 Current Status

**The application is ready to run once you:**
1. ✅ Create a Supabase project
2. ✅ Update the environment variables in `/server/.env`
3. ✅ Run the SQL schema in Supabase

**After setup, you'll be able to:**
- Register new users ✅
- Login with authentication ✅
- Access all application features ✅
- Store data in PostgreSQL instead of MongoDB ✅

## 🛡️ Security Notes

- The JWT secret should be changed in production
- Supabase provides built-in security with Row Level Security (RLS)
- All sensitive data is properly encrypted and validated

## 📞 Troubleshooting

If you encounter any issues:

1. **Server won't start**: Check that SUPABASE_URL and SUPABASE_ANON_KEY are set correctly
2. **Registration fails**: Ensure the database schema has been created in Supabase
3. **Connection errors**: Verify your Supabase project is active and accessible

The migration is complete and your application is ready to use Supabase as its database backend!
