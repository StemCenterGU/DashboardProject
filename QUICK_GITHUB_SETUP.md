# Quick GitHub Setup - Step by Step

## Your Situation
- ❌ Can't access Settings (404 error) = No Admin access
- ✅ Can see repository = You have Read/Write access
- ✅ Code is safe on your computer
- ✅ Need to backup to new repository

## Solution: Create New Repository

### Step 1: Create New Repository on GitHub

1. **Log into GitHub**: https://github.com/login
   - Username: `AvishManiar21`

2. **Create New Repository**:
   - Click **+** (top right) → **New repository**
   - Repository name: `stem-face-dashboard`
   - Description: (optional) "Tutoring Dashboard - Recovered Project"
   - **Visibility**: Choose **Private** (recommended)
   - **DO NOT** check:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
   - Click **Create repository**

3. **Copy the Repository URL**:
   - GitHub will show you a page with setup instructions
   - Copy the URL, it will look like:
     ```
     https://github.com/AvishManiar21/stem-face-dashboard.git
     ```

### Step 2: Run Setup Script

1. **Double-click**: `setup_github.bat` in your project folder
   - OR run the commands manually below

### Step 3: Manual Commands (if script doesn't work)

Open **Command Prompt** or **PowerShell** in your project folder:

```bash
# Navigate to project
cd "C:\Users\avish\OneDrive\Desktop\dashboard_project\stem-face-dashboard"

# Initialize git (if not done)
git init

# Configure git (use your email for AvishManiar21 account)
git config user.name "AvishManiar21"
git config user.email "YOUR_EMAIL@example.com"

# Add all files
git add .

# Create commit
git commit -m "Initial commit - recovered project"

# Add remote (REPLACE with your actual repository URL)
git remote add origin https://github.com/AvishManiar21/stem-face-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: When you run `git push`, GitHub will ask for credentials:
- **Username**: `AvishManiar21`
- **Password**: Use a **Personal Access Token** (not your GitHub password)
  - Create token: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Select scopes: `repo` (full control)
  - Copy the token and use it as password

### Step 4: Verify

1. Go to: https://github.com/AvishManiar21/stem-face-dashboard
2. You should see all your files there!

## What About the Old Repository?

- **You can still access it** via `AvishManiar21` (read/write)
- **You can't transfer it** (no Admin access)
- **Your code is now safe** in the new repository
- **Old repo**: Keep it for reference or ask the owner to transfer it later

## Need Help?

Tell me:
1. ✅ Did you create the new repository?
2. ✅ What's the repository URL?
3. ✅ Any errors when running the commands?

I'll help you fix any issues!

