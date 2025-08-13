# Netlify Deployment Guide for ITR Assist

This document provides step-by-step instructions for setting up automated deployment of the ITR Assist platform to Netlify.

## 🚀 Quick Setup

### 1. Netlify Account Setup

1. Sign up for a free [Netlify account](https://netlify.com)
2. Connect your GitHub account to Netlify
3. Import your `kdadks/ITRA` repository

### 2. Environment Variables

Set the following environment variables in your Netlify dashboard:

**Site Settings > Environment Variables:**

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration (if using separate backend)
REACT_APP_API_URL=https://your-backend-api.com

# Build Configuration
CI=false
GENERATE_SOURCEMAP=false
```

### 3. GitHub Secrets

Add the following secrets to your GitHub repository:

**Settings > Secrets and Variables > Actions:**

```
NETLIFY_AUTH_TOKEN=your_netlify_personal_access_token
NETLIFY_SITE_ID=your_netlify_site_id
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=https://your-backend-api.com
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
