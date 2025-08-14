# Deploy ITR Assist Backend to Railway

## Quick Setup (5 minutes)

### Step 1: Prepare Your Server for Deployment

First, let's add a start script to your server package.json:

```bash
cd server
npm install
```

### Step 2: Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Authorize Railway to access your repositories

### Step 3: Deploy Backend
1. Click "New Project" 
2. Select "Deploy from GitHub repo"
3. Choose your `kdadks/ITRA` repository
4. Railway will auto-detect it's a Node.js app
5. Set the root directory to `server` in the settings
6. Railway will automatically deploy!

### Step 4: Configure Environment Variables
In Railway dashboard, go to Variables tab and add:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key-here
CLIENT_URL=https://your-netlify-app.netlify.app
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Step 5: Get Your API URL
Railway will provide you with a URL like: `https://your-app-name.up.railway.app`

### Step 6: Update Netlify Environment Variables
In your Netlify dashboard, set:
`REACT_APP_API_URL` = `https://your-app-name.up.railway.app/api`

## Alternative: Quick Heroku Deployment

```bash
# In your server directory
cd server
heroku create your-itr-assist-api
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set CLIENT_URL=https://your-netlify-app.netlify.app
git init
git add .
git commit -m "Deploy to Heroku"
heroku git:remote -a your-itr-assist-api
git push heroku main
```

Your API will be at: `https://your-itr-assist-api.herokuapp.com/api`
