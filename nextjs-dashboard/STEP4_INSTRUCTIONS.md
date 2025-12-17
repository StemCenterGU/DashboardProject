# Step 4: Install shadcn/ui Components

## Method 1: Run Batch File (Easiest)

1. Navigate to `nextjs-dashboard` folder
2. Double-click `INSTALL_SHADCN_COMPONENTS.bat`
3. Wait for it to finish installing all components

## Method 2: Manual Installation

Open Command Prompt or PowerShell in `nextjs-dashboard` folder and run these commands one by one:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
```

## What Each Component Does

- **button** - Buttons for forms and actions
- **card** - Card containers for content
- **input** - Text input fields
- **label** - Form labels
- **alert** - Error/success messages
- **dropdown-menu** - User menu dropdown
- **avatar** - User profile picture

## Expected Output

You should see messages like:
```
✓ Added component button
✓ Added component card
...
```

Components will be installed in `components/ui/` folder.

## Troubleshooting

### If "command not found" error:
- Make sure you're in the `nextjs-dashboard` folder
- Make sure you ran `npm install` first (Step 1)

### If components already exist:
- That's fine! It means they're already installed
- You can skip this step

### If shadcn/ui not initialized:
- Run `npx shadcn-ui@latest init` first (Step 3)
- Then come back to install components

## After Installation

Once components are installed, you can:
- Run `npm run dev` to start the server
- Visit http://localhost:3000 to see your app!

