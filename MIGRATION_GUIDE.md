# Migration from Express Server to Netlify Functions

## 🔄 What Changed

### Before (Express + Separate Deployment)
```
Frontend (React) → Netlify
Backend (Express) → Heroku/Railway/etc
Database → Supabase
```

### After (Unified Netlify Deployment)
```
Frontend (React) → Netlify 
Backend (Functions) → Netlify Functions
Database → Supabase
```

## 📁 New File Structure

```
ITR Assist/
├── client/                    # React frontend (unchanged)
├── server/                    # Original Express server (keep for reference)
├── netlify/
│   └── functions/             # NEW: Serverless functions
│       ├── package.json       # Function dependencies
│       ├── utils.js           # Shared utilities
│       ├── register.js        # User registration
│       ├── login.js           # User login  
│       ├── me.js              # Get current user
│       ├── profile.js         # User profile CRUD
│       └── health.js          # Health check
├── netlify.toml              # UPDATED: Added functions config
└── .env.example              # UPDATED: New environment variables
```

## 🔧 Key Changes Made

### 1. API Endpoint Changes
**Before:** `/api/auth/register` → **After:** `/register`
**Before:** `/api/auth/login` → **After:** `/login` 
**Before:** `/api/auth/me` → **After:** `/me`

### 2. Environment Variables
**NEW Variables:**
- `SUPABASE_SERVICE_KEY` (instead of anon key for server operations)
- `JWT_SECRET` (for token signing)

**UPDATED Variables:**
- `REACT_APP_API_URL=/.netlify/functions` (points to Netlify Functions)

### 3. AuthContext Updates
- Updated API endpoints (removed `/api/auth` prefix)
- Functions automatically handle CORS
- Same authentication flow, different backend

## 🚀 Deployment Benefits

### Advantages
✅ **Single platform deployment** (everything on Netlify)
✅ **Automatic scaling** (serverless functions scale with demand)
✅ **No server management** (no need to manage Express server)
✅ **Built-in CORS handling** (no more CORS configuration)
✅ **Integrated with frontend** (same domain, no cross-origin issues)
✅ **Cost effective** (pay per function execution)

### Considerations
⚠️ **Cold starts** (functions may have slight delay on first request)
⚠️ **Timeout limits** (functions timeout after 10 seconds on free plan)
⚠️ **Stateless** (no persistent server state between requests)

## 🔄 Migration Steps Completed

1. ✅ **Created Netlify Functions** for core auth endpoints
2. ✅ **Updated netlify.toml** with functions configuration  
3. ✅ **Updated AuthContext** to use new endpoints
4. ✅ **Added CORS handling** in all functions
5. ✅ **Created utilities** for shared code
6. ✅ **Updated environment variables**

## 🧪 Testing the Migration

### Local Testing
```bash
# Install Netlify CLI (if not installed)
npx netlify-cli dev

# This will start:
# - React app on http://localhost:3000  
# - Functions on http://localhost:8888/.netlify/functions/
```

### Function URLs (Local)
- Register: http://localhost:8888/.netlify/functions/register
- Login: http://localhost:8888/.netlify/functions/login
- Profile: http://localhost:8888/.netlify/functions/me
- Health: http://localhost:8888/.netlify/functions/health

### Function URLs (Production) 
- Register: https://your-site.netlify.app/.netlify/functions/register
- Login: https://your-site.netlify.app/.netlify/functions/login
- Profile: https://your-site.netlify.app/.netlify/functions/me
- Health: https://your-site.netlify.app/.netlify/functions/health

## 📝 Next Steps

1. **Set up environment variables** in `.env` file
2. **Test locally** with `npx netlify-cli dev`
3. **Deploy to Netlify** 
4. **Add remaining functions** (tax calculations, documents, etc.)
5. **Remove old Express server** once everything works

## 🔄 Rollback Plan

If needed, you can easily rollback:
1. The original Express server code is preserved in `/server/`
2. Simply change `REACT_APP_API_URL` back to your Express server URL
3. Deploy Express server to separate hosting platform

## 📞 Support

If you encounter issues:
1. Check function logs in Netlify dashboard
2. Test individual functions with curl/Postman
3. Verify environment variables are set correctly
4. Check Supabase connection and permissions
