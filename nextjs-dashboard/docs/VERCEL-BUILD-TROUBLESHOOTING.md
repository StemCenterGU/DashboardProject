# Vercel Build: "Module not found" for @/lib/... 

If the build fails with **53 errors** like `Can't resolve '@/lib/analytics'`, `@/lib/supabase'`, `@/lib/auth'`, etc., check the following.

---

## 1. Root Directory must match your repo layout

In Vercel: **Settings → Build and Deployment → Root Directory**.

- If your repo is **DashboardProject** and the Next.js app is in **stem-face-dashboard/nextjs-dashboard**, set Root Directory to:  
  **`stem-face-dashboard/nextjs-dashboard`**
- If your repo root **is** the Next.js app (no extra parent folder), leave Root Directory **empty** or **`.`**

If Root Directory is wrong, the build runs from the wrong folder and `@/` paths won’t find `lib/`, `app/`, etc.

---

## 2. All app files must be on the deployed branch

The **version2** branch (or whatever branch you deploy) must contain the full app, including:

- **lib/** (e.g. `lib/analytics.ts`, `lib/analytics/`, `lib/auth.ts`, `lib/supabase.ts`, `lib/supabase-server.ts`, `lib/utils.ts`, `lib/wconline.ts`, `lib/wconline-sync.ts`, `lib/ml/predictions.ts`)
- **app/**, **components/**, **types/**, **public/**, etc.

If `lib/` (or any of these) was never committed or is only on another branch, the Vercel build will fail with "Module not found" for `@/lib/...`.

**Check:** From your repo root run:

```bash
git ls-tree -r version2 --name-only | findstr lib
```

(or on Mac/Linux: `git ls-tree -r version2 --name-only | grep lib`). You should see paths like `nextjs-dashboard/lib/...` or `stem-face-dashboard/nextjs-dashboard/lib/...` depending on your layout.

---

## 3. tsconfig.json has baseUrl for path resolution

This project’s **tsconfig.json** includes **`"baseUrl": "."`** so that path aliases like `@/lib/analytics` resolve the same locally and on Vercel. If you changed tsconfig, keep `baseUrl` and the `paths` for `@/*`.

---

## Summary

| Check | Action |
|-------|--------|
| Root Directory | Set to the folder that contains `package.json` and `lib/` (e.g. `stem-face-dashboard/nextjs-dashboard` or leave empty if repo root is the app). |
| Branch content | Ensure `lib/` and the rest of the app are committed and pushed to the branch you deploy (e.g. **version2**). |
| baseUrl | Keep `"baseUrl": "."` in **tsconfig.json**. |

After fixing Root Directory and/or pushing the missing files, trigger a new deployment on Vercel.
