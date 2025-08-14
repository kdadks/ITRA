# Netlify Full-Stack Deployment Guide for ITR Assist

This document provides step-by-step instructions for deploying the complete ITR Assist platform (frontend + backend) to Netlify using Netlify Functions.

## 🏗️ Architecture Overview

**NEW ARCHITECTURE:**
- **Frontend:** React SPA hosted on Netlify
- **Backend:** Node.js converted to Netlify Functions (serverless)
- **Database:** Supabase PostgreSQL
- **Authentication:** JWT with Netlify Functions
- **Deployment:** Single platform (Netlify)

## 🚀 Quick Setup

### 1. Prerequisites

- Node.js 18+ installed
- Netlify account
- Supabase account and project
- GitHub repository

### 2. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 3. Environment Variables Setup

**Create `.env` file in project root:**
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET=your_super_secret_jwt_key_here

# React App Configuration  
REACT_APP_API_URL=/.netlify/functions
```

### 4. Set Netlify Environment Variables

**Netlify Dashboard > Site Settings > Environment Variables:**
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET=your_super_secret_jwt_key_here
REACT_APP_API_URL=/.netlify/functions
```

## 📋 Deployment Steps

### Step 1: Install Dependencies

```bash
# Install function dependencies
cd netlify/functions && npm install

# Install React dependencies  
cd ../../client && npm install
```

### Step 2: Test Locally

```bash
# From project root
netlify dev
```

This starts:
- React app: http://localhost:3000
- Functions: http://localhost:8888/.netlify/functions/

### Step 3: Deploy to Netlify

**Option A: Git-based deployment (Recommended)**
1. Push your code to GitHub
2. Connect repository to Netlify
3. Netlify auto-deploys on every push to main

**Option B: Manual deployment**
```bash
# Build and deploy
netlify deploy --prod
```

## 📋 Configuration Files

### 1. `netlify.toml`
- Main Netlify configuration
- Build settings and redirects
- Security headers
- SPA routing support

### 2. `.github/workflows/deploy.yml`
- GitHub Actions workflow
- Automated testing and deployment
- Preview deployments for PRs

### 3. `build.sh`
- Custom build script
- Environment validation
- Build verification

## 🔧 Manual Deployment Steps

### Option 1: Connect GitHub Repository

1. In Netlify dashboard, click "Add new site"
2. Choose "Import an existing project"
3. Select GitHub and authorize
4. Choose your `kdadks/ITRA` repository
5. Configure build settings:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/build`

### Option 2: Drag & Drop Deployment

1. Build locally:
   ```bash
   cd client
   npm install
   npm run build
   ```

2. Drag the `client/build` folder to Netlify dashboard

## 🔄 Automated Deployment

### Continuous Deployment

- **Main branch**: Automatically deploys to production
- **Pull requests**: Creates preview deployments
- **Other branches**: Creates branch-specific deployments

### Build Process

1. **Install dependencies** for client and server
2. **Run tests** (client-side)
3. **Build React application** with environment variables
4. **Deploy to Netlify** using CLI
5. **Create preview URLs** for pull requests

### Deployment Triggers

- Push to `main` branch → Production deployment
- Pull request → Preview deployment
- Manual trigger → On-demand deployment

## 🌐 Custom Domain Setup

### 1. Add Custom Domain

1. Go to Site Settings > Domain management
2. Click "Add custom domain"
3. Enter your domain name
4. Verify domain ownership

### 2. SSL Configuration

- Netlify provides free SSL certificates
- Automatically configured for custom domains
- Force HTTPS redirect enabled

## 🔍 Monitoring & Analytics

### Build Logs

- View build logs in Netlify dashboard
- GitHub Actions logs for detailed information
- Error notifications via email/Slack

### Performance Monitoring

- Core Web Vitals tracking
- Bundle size analysis
- Load time optimization

## 📊 Performance Optimization

### Build Optimizations

```javascript
// In client/package.json build script
"build": "GENERATE_SOURCEMAP=false react-scripts build"
```

### Asset Optimization

- Automatic image optimization
- Gzip compression
- CDN distribution
- Cache headers for static assets

## 🔒 Security Features

### Headers Configuration

- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Access Control

- Role-based redirects
- API proxy configuration
- Environment-specific routing

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check environment variables
   # Verify package.json scripts
   # Review build logs
   ```

2. **Routing Issues**
   ```toml
   # Ensure SPA redirect is configured
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **API Connection Issues**
   ```env
   # Verify API URLs in environment variables
   REACT_APP_API_URL=https://your-api-domain.com
   ```

### Debug Commands

```bash
# Test build locally
cd client && npm run build

# Check environment variables
netlify env:list

# Test deployment
netlify deploy --dir=client/build --prod
```

## 📞 Support

- [Netlify Documentation](https://docs.netlify.com)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Documentation](https://supabase.io/docs)

## 🎯 Next Steps

1. ✅ Set up Netlify account
2. ✅ Configure environment variables
3. ✅ Add GitHub secrets
4. ✅ Test deployment
5. ⏭️ Set up custom domain
6. ⏭️ Configure monitoring
7. ⏭️ Set up backend deployment (Heroku/Railway)

---

**Note:** Make sure to update the API URLs in the configuration files with your actual backend deployment URLs once your server is deployed.
