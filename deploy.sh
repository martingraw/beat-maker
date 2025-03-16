#!/bin/bash

# Direct deployment script for GitHub Pages
echo "Starting manual deployment to GitHub Pages..."

# Make sure we're in the github-upload directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Install gh-pages if not already installed
if [ ! -d "node_modules/gh-pages" ]; then
  echo "Installing gh-pages package..."
  npm install --save-dev gh-pages
fi

# Build the app
echo "Building the app..."
npm run build

# Deploy to GitHub Pages
echo "Deploying to GitHub Pages..."
npx gh-pages -d build

echo "Deployment complete!"
echo "Your app should be available at https://martingraw.github.io/beat-maker/ shortly."
echo "If you still see the README file, try clearing your browser cache or opening in an incognito window."
