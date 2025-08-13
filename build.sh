#!/bin/bash

# Netlify Build Script for ITR Assist
# This script ensures proper build process for the React application

set -e

echo "🚀 Starting ITR Assist build process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ No package.json found. Make sure you're in the client directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Set build environment
export CI=false
export GENERATE_SOURCEMAP=false

# Check for required environment variables
if [ -z "$REACT_APP_SUPABASE_URL" ]; then
    echo "⚠️  Warning: REACT_APP_SUPABASE_URL not set"
fi

if [ -z "$REACT_APP_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Warning: REACT_APP_SUPABASE_ANON_KEY not set"
fi

# Build the application
echo "🔨 Building React application..."
npm run build

# Verify build output
if [ ! -d "build" ]; then
    echo "❌ Build directory not found!"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo "❌ index.html not found in build directory!"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build artifacts:"
ls -la build/

# Optional: Run build verification
echo "🔍 Verifying build..."
BUILD_SIZE=$(du -sh build | cut -f1)
echo "📊 Total build size: $BUILD_SIZE"

# Check for large files that might slow down the site
find build -type f -size +1M -exec ls -lh {} \; | awk '{ print "⚠️  Large file: " $9 " (" $5 ")" }'

echo "🎉 ITR Assist build process completed!"
