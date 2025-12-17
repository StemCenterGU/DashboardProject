# GitHub Recovery Guide - Using Collaborator Account

## Your Situation
- **Disabled Google Account**: Cannot access GitHub account tied to that email
- **Collaborator Account**: `AvishManiar21` has access to the repository
- **Goal**: Secure your code and transfer ownership if possible

## Step-by-Step Recovery Process

### Option 1: Transfer Repository Ownership (RECOMMENDED)

If `AvishManiar21` has **Admin** access to the repository:

1. **Log into GitHub as `AvishManiar21`**
   - Go to: https://github.com/login
   - Sign in with your `AvishManiar21` account

2. **Navigate to the Repository**
   - Find the repository that was tied to your disabled Google account
   - Make sure you can see it and have Admin access

3. **Transfer Ownership**
   - Go to: **Settings** → Scroll to **Danger Zone**
   - Click **Transfer ownership**
   - Enter your new GitHub username (or keep it under `AvishManiar21`)
   - Confirm the transfer

**This transfers everything**: code, issues, pull requests, history, etc.

### Option 2: Add New Account as Collaborator

If you want to use a different GitHub account:

1. **Log into GitHub as `AvishManiar21`**
2. **Go to the Repository** → **Settings** → **Collaborators**
3. **Add your new GitHub username** with **Admin** access
4. **Accept the invitation** from your new account
5. **Transfer ownership** (if you have Admin) or work as collaborator

### Step 3: Connect Your Local Project to GitHub

After you've secured access via `AvishManiar21`:

#### A. If Repository Already Exists on GitHub:

```bash
# Navigate to your project
cd "C:\Users\avish\OneDrive\Desktop\dashboard_project\stem-face-dashboard"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - recovered from disabled Google account"

# Add remote repository
git remote add origin https://github.com/AvishManiar21/REPO_NAME.git
# OR if transferred to new account:
# git remote add origin https://github.com/NEW_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### B. If You Need to Create a New Repository:

1. **Log into GitHub as `AvishManiar21`**
2. **Create New Repository**:
   - Click **+** → **New repository**
   - Name: `stem-face-dashboard` (or your preferred name)
   - Make it **Private** (recommended)
   - **Don't** initialize with README (you already have code)
   - Click **Create repository**

3. **Connect Local Project**:
```bash
cd "C:\Users\avish\OneDrive\Desktop\dashboard_project\stem-face-dashboard"

git init
git add .
git commit -m "Initial commit - recovered project"

git remote add origin https://github.com/AvishManiar21/stem-face-dashboard.git
git branch -M main
git push -u origin main
```

### Step 4: Update Git Credentials

Make sure you're authenticated with `AvishManiar21`:

```bash
# Set your GitHub username
git config --global user.name "AvishManiar21"
git config --global user.email "YOUR_EMAIL_FOR_AVISHMANIAR21@example.com"

# Use GitHub CLI or Personal Access Token for authentication
# Generate token: https://github.com/settings/tokens
# Use token as password when pushing
```

## Important Notes

1. **Your code is SAFE** - It's on your computer, you won't lose it
2. **Supabase is independent** - Your database isn't tied to GitHub
3. **Local files are fine** - All your `.env`, data, etc. are local
4. **Backup first** - Consider copying the entire `stem-face-dashboard` folder before making changes

## Next Steps

1. ✅ Log into GitHub as `AvishManiar21`
2. ✅ Find/access the repository
3. ✅ Transfer ownership or add new account
4. ✅ Connect local project to GitHub
5. ✅ Push your code

## Need Help?

If you encounter issues:
- Check: Can you see the repository when logged in as `AvishManiar21`?
- Verify: Do you have Admin access or just Read/Write?
- Confirm: What's the exact repository name/URL?

Let me know what you find and I'll help you with the exact commands!

