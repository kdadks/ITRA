# 🔑 Getting Your Supabase Service Role Key

## Why You Need This

Your **Netlify Functions** need the **Service Role Key** (not the anon key) to perform server-side operations like:
- Creating user accounts
- Updating user data 
- Admin operations

The **anon key** you currently have is only for client-side operations.

## How to Get Your Service Role Key

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `prtuxsqsuojimjgnovwn`

2. **Navigate to Settings**
   - Click on **Settings** (gear icon in sidebar)
   - Click on **API** in the Settings menu

3. **Copy the Service Role Key**
   - Look for the **"service_role"** section
   - Copy the **"secret"** key (it starts with `eyJ...`)
   - ⚠️ **Keep this secret!** This key has admin privileges

4. **Update Your Environment Files**

   **In `/ITR Assist/.env` (root folder):**
   ```env
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_service_key_here...
   ```

   **In Netlify Dashboard (for production):**
   - Go to: Site Settings > Environment variables
   - Add: `SUPABASE_SERVICE_KEY` = `your_actual_service_key`

## 🔐 Key Differences

| Key Type | Purpose | Where Used | Permissions |
|----------|---------|------------|-------------|
| **anon** | Client-side | React app | Limited (RLS policies) |
| **service_role** | Server-side | Netlify Functions | Admin (bypasses RLS) |

## ⚠️ Security Notes

- **Never expose service_role key** in client-side code
- **Only use in server environment** (Netlify Functions)
- **Keep it secret** - treat it like a password

## 🧪 Test After Setup

Once you add the service role key, test your functions:
```bash
# Test registration endpoint
curl -X POST https://your-site.netlify.app/.netlify/functions/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User", 
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'
```
