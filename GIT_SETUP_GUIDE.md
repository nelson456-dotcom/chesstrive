# Git Repository Setup Guide

This guide will help you set up a Git repository for your chess application and deploy it to your VPS.

## Why Use Git?

✅ **Easy Updates**: Just `git pull` on your VPS to update code  
✅ **Version Control**: Track changes and rollback if needed  
✅ **Best Practice**: Industry standard for deployment  
✅ **Backup**: Your code is safely stored in the cloud  

---

## Step 1: Create a Git Repository

### Option A: GitHub (Recommended - Free)

1. **Create GitHub Account** (if you don't have one)
   - Go to [https://github.com](https://github.com)
   - Sign up for a free account

2. **Create New Repository**
   - Click the **"+"** icon (top right) → **"New repository"**
   - Repository name: `chessrep` (or your preferred name)
   - Description: "Chess Analysis Application"
   - Choose: **Private** (recommended) or **Public**
   - **DO NOT** initialize with README, .gitignore, or license (you already have these)
   - Click **"Create repository"**

3. **Copy Repository URL**
   - You'll see a page with setup instructions
   - Copy the repository URL (e.g., `https://github.com/yourusername/chessrep.git`)

### Option B: GitLab (Alternative - Also Free)

1. Go to [https://gitlab.com](https://gitlab.com)
2. Sign up and create a new project
3. Follow similar steps as GitHub

---

## Step 2: Prepare Your Local Code

### 1. Ensure .env Files Are Ignored

**IMPORTANT**: Never commit `.env` files with secrets!

Check your `.gitignore` file includes:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.development
backend/.env
frontend/.env
*.env

# Python virtual environment
venv/
.venv/
__pycache__/

# Node modules
node_modules/

# Build files
build/
dist/
```

If not already there, add these to your `.gitignore`.

### 2. Create .env.example Files (Template)

Create template files that show what variables are needed (without actual secrets):

**Create `backend/.env.example`:**
```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=chessrep

# Server Configuration
ALLOWED_ORIGINS=http://localhost:3000
PORT=8001

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Redis (if using)
REDIS_URL=redis://localhost:6379
```

**Create `frontend/.env.example`:**
```env
REACT_APP_API_URL=http://localhost:8001/api
REACT_APP_WS_URL=ws://localhost:8001/ws
```

These `.env.example` files can be committed to Git safely.

---

## Step 3: Initialize Git and Push to Repository

### On Your Local Machine (Windows)

Open PowerShell in your project directory:

```powershell
# Navigate to your project
cd "C:\Users\Nizar\Desktop\chessrep-main - Copy\chessrep-main"

# Initialize Git (if not already initialized)
git init

# Check current status
git status

# Add all files (except those in .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: Chess application"

# Add remote repository (replace with your actual GitHub URL)
git remote add origin https://github.com/yourusername/chessrep.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: If you're asked for credentials:
- GitHub: Use a **Personal Access Token** (not your password)
  - Go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  - Give it `repo` permissions
  - Use this token as your password when pushing

---

## Step 4: Update Deployment Guide for Git

Now update your VPS deployment to use Git instead of manual upload.

### On Your VPS

```bash
# Install Git (if not already installed)
sudo apt-get install -y git

# Navigate to application directory
cd /var/www/chessrep

# Clone your repository
git clone https://github.com/yourusername/chessrep.git .

# Or if directory already exists:
cd /var/www
sudo rm -rf chessrep  # Remove old directory
git clone https://github.com/yourusername/chessrep.git chessrep
cd chessrep
```

### Set Up Environment Variables on VPS

```bash
# Copy example files and create actual .env files
cd /var/www/chessrep/backend
cp .env.example .env
nano .env  # Edit with your production values

cd ../frontend
cp .env.example .env
nano .env  # Edit with your production values
```

---

## Step 5: Update Deployment Process

### Initial Setup (One Time)

```bash
cd /var/www/chessrep

# Install dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
npm install  # if using Node.js backend

cd ../frontend
npm install
npm run build

# Start with PM2
cd ../backend
pm2 start ecosystem.config.js
pm2 save
```

### Updating Code (Every Time You Make Changes)

```bash
cd /var/www/chessrep

# Pull latest changes
git pull origin main

# Update dependencies if needed
cd backend
source venv/bin/activate
pip install -r ../requirements.txt  # if requirements changed
npm install  # if package.json changed

cd ../frontend
npm install  # if package.json changed
npm run build  # Rebuild frontend

# Restart backend
pm2 restart chessrep-backend
```

---

## Step 6: Create Update Script (Optional but Recommended)

Create a script to automate updates:

```bash
nano /var/www/chessrep/update.sh
```

Add this content:

```bash
#!/bin/bash
set -e

echo "Updating ChessRep application..."

cd /var/www/chessrep

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Update backend dependencies
echo "Updating backend dependencies..."
cd backend
source venv/bin/activate
pip install -r ../requirements.txt --quiet

# Update frontend dependencies and rebuild
echo "Updating frontend..."
cd ../frontend
npm install --silent
npm run build

# Restart backend
echo "Restarting backend..."
pm2 restart chessrep-backend

echo "Update complete!"
```

Make it executable:

```bash
chmod +x /var/www/chessrep/update.sh
```

Now you can update with just:

```bash
/var/www/chessrep/update.sh
```

---

## Best Practices

### 1. Branch Strategy

For production, use a stable branch:

```bash
# On VPS, always pull from main branch
git pull origin main

# Or create a 'production' branch
git checkout -b production
git push -u origin production

# On VPS
git pull origin production
```

### 2. Commit Messages

Use clear commit messages:

```bash
git commit -m "Fix: Resolve login authentication issue"
git commit -m "Feature: Add new chess analysis tool"
git commit -m "Update: Improve UI responsiveness"
```

### 3. Never Commit Secrets

**ALWAYS** check before committing:

```bash
# Check what will be committed
git status

# If you see .env files, remove them:
git reset HEAD backend/.env
git reset HEAD frontend/.env

# Verify .gitignore is working
git check-ignore -v backend/.env
```

### 4. Use .env.example Files

Keep `.env.example` files updated in Git so others (and future you) know what variables are needed.

---

## Troubleshooting

### Issue: "Permission denied" when pushing

**Solution**: Use SSH keys or Personal Access Token
- GitHub: Settings → SSH and GPG keys → New SSH key
- Or use Personal Access Token as password

### Issue: "Large files" error

**Solution**: 
```bash
# Remove large files from history
git rm --cached large-file.zip
git commit -m "Remove large file"
```

### Issue: "Merge conflicts" on VPS

**Solution**:
```bash
# Stash local changes (if any)
git stash

# Pull latest
git pull origin main

# Apply stashed changes
git stash pop

# Resolve conflicts manually if needed
```

---

## Quick Reference

```bash
# Local development
git add .
git commit -m "Your message"
git push origin main

# On VPS - Update code
cd /var/www/chessrep
git pull origin main
cd frontend && npm run build
pm2 restart chessrep-backend

# Check status
git status
git log --oneline -5  # Last 5 commits
```

---

## Security Checklist

Before pushing to Git:

- [ ] `.env` files are in `.gitignore`
- [ ] No API keys in code
- [ ] No passwords in code
- [ ] No database credentials in code
- [ ] `.env.example` files are created
- [ ] Repository is private (if contains sensitive info)

---

**You're all set!** Now you can easily update your VPS by just running `git pull` and rebuilding. 🚀

