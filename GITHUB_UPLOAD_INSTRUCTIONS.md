# GitHub Upload and Deployment Instructions

This folder contains a clean copy of your Beat Maker app, ready to be uploaded to GitHub and deployed to GitHub Pages. Follow these steps to get your app live:

## Steps to Upload to GitHub

1. **Navigate to the github-upload directory**:
   ```
   cd github-upload
   ```

2. **Initialize a Git repository**:
   ```
   git init
   ```

3. **Add all files to the staging area**:
   ```
   git add .
   ```

4. **Commit the files**:
   ```
   git commit -m "Initial commit of Beat Maker app"
   ```

5. **Add your GitHub repository as a remote**:
   ```
   git remote add origin https://github.com/martingraw/beat-maker.git
   ```

6. **Push the code to GitHub**:
   ```
   git push -u origin main
   ```
   (If your default branch is called "master" instead of "main", use `git push -u origin master`)

## Deploying to GitHub Pages

The repository has been set up with GitHub Actions for automatic deployment to GitHub Pages. Here's how it works:

1. **After pushing to GitHub**, go to your repository on GitHub.com

2. **Enable GitHub Pages**:
   - Go to Settings > Pages
   - Under "Source", select "GitHub Actions"
   - This tells GitHub to use the workflow file we've created

3. **Wait for the deployment**:
   - The GitHub Actions workflow will automatically build and deploy your app
   - You can monitor the progress in the "Actions" tab of your repository
   - Once complete, your app will be live at: https://martingraw.github.io/beat-maker/

4. **For future updates**:
   - Simply push changes to the main branch
   - The GitHub Actions workflow will automatically rebuild and redeploy your app

## Manual Deployment Option

If you prefer to deploy manually without GitHub Actions:

```
npm install
npm run deploy
```

This will build the app and deploy it to the gh-pages branch of your repository.

## Notes

- The `.gitignore` file has been set up to exclude unnecessary files like node_modules, build files, and system files.
- All your source code, public assets, and configuration files have been copied to this directory.
- Your original Beat Maker app in the beat-maker directory remains untouched.
- The `homepage` field in package.json has been set to "https://martingraw.github.io/beat-maker"
- A GitHub Actions workflow file has been added in `.github/workflows/deploy.yml`

## If You Need to Make Changes

If you need to make any changes to the code before uploading to GitHub, make them in this github-upload directory, not in your original beat-maker directory.
