# Corrected Commands - Use `shadcn` (not `shadcn-ui`)

## ⚠️ Important: Package Name Changed

The `shadcn-ui` package is **deprecated**. Use `shadcn` instead!

## Step 3: Initialize shadcn/ui

```bash
npx shadcn@latest init
```

**Answer the prompts:**
- ✅ TypeScript? **Yes**
- ✅ Style? **Default**
- ✅ Base color? **Slate**
- ✅ CSS variables? **Yes**
- ✅ Import alias? Press Enter (use defaults)

## Step 4: Install Components

Run the batch file:
```bash
install-components.bat
```

**OR** manually run:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add alert
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
```

## Quick Setup (All in One)

```bash
# 1. Initialize
npx shadcn@latest init

# 2. Install all components
npx shadcn@latest add button card input label alert dropdown-menu avatar
```

That's it! The batch files have been updated to use the correct package name.

