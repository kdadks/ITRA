# Development with Netlify Functions

## Local Development Setup

1. **Install Netlify CLI globally:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Install function dependencies:**
   ```bash
   cd netlify/functions && npm install
   ```

3. **Start local development server:**
   ```bash
   # From project root
   netlify dev
   ```

   This will:
   - Start your React app on http://localhost:3000
   - Start Netlify Functions on http://localhost:8888
   - Proxy API calls from React to Functions

## Function URLs (Local Development)

- http://localhost:8888/.netlify/functions/register
- http://localhost:8888/.netlify/functions/login
- http://localhost:8888/.netlify/functions/me
- http://localhost:8888/.netlify/functions/profile
- http://localhost:8888/.netlify/functions/health

## Function URLs (Production)

- https://your-site.netlify.app/.netlify/functions/register
- https://your-site.netlify.app/.netlify/functions/login
- https://your-site.netlify.app/.netlify/functions/me
- https://your-site.netlify.app/.netlify/functions/profile
- https://your-site.netlify.app/.netlify/functions/health

## Environment Variables Setup

### Local Development (.env in project root)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret_key
```

### Netlify Production
Set in Netlify Dashboard > Site Settings > Environment Variables:
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- JWT_SECRET

## Testing Functions

### Test Registration:
```bash
curl -X POST http://localhost:8888/.netlify/functions/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'
```

### Test Login:
```bash
curl -X POST http://localhost:8888/.netlify/functions/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Test Health Check:
```bash
curl http://localhost:8888/.netlify/functions/health
```
