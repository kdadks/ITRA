# Backend Deployment Options for ITR Assist

## Current Issue
Your React frontend is trying to connect to `localhost:5000/api/auth/register` in production, which fails because localhost only works in development.

## Solution: Deploy Your Backend

### Option 1: Heroku (Recommended for beginners)
1. Install Heroku CLI
2. Create new Heroku app: `heroku create your-itr-assist-api`
3. Set environment variables in Heroku dashboard
4. Deploy: `git subtree push --prefix server heroku main`
5. Your API URL will be: `https://your-itr-assist-api.herokuapp.com/api`

### Option 2: Railway
1. Connect GitHub repo to Railway
2. Select the `server` folder as root
3. Your API URL will be: `https://your-app.up.railway.app/api`

### Option 3: Render
1. Create new Web Service on Render
2. Connect GitHub repo
3. Set root directory to `server`
4. Your API URL will be: `https://your-app.onrender.com/api`

### Option 4: Vercel (Serverless)
1. Deploy server folder as Vercel project
2. Your API URL will be: `https://your-api.vercel.app/api`

## After Backend Deployment

1. Update Netlify environment variable:
   `REACT_APP_API_URL` = `https://your-deployed-backend.com/api`

2. Update your backend CORS settings to allow your Netlify domain:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:3000', // development
       'https://your-netlify-domain.netlify.app' // production
     ],
     credentials: true
   }));
   ```

3. Redeploy both frontend and backend

## Quick Fix for Testing
If you need a temporary fix while setting up backend deployment:

1. In Netlify, set `REACT_APP_API_URL` to your local IP address (if accessible)
2. Or use ngrok to expose your local server temporarily
