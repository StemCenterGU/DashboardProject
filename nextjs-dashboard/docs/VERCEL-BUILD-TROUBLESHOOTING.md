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

## 4. If "Module not found" still happens: Webpack build + alias

This project is set up to avoid Turbopack path-resolution issues on Vercel:

- **Build script** uses Webpack: `next build --webpack` (in **package.json**).
- **next.config.mjs** sets a Webpack resolve alias: `@` → project root (the folder containing `next.config.mjs`).

So the production build uses Webpack and explicitly resolves `@/lib/...` to `./lib/...` relative to the Next.js app root. If you still see "Module not found" for `@/lib/...`:

1. Confirm **Root Directory** (see §1) is the folder that contains `next.config.mjs` and `lib/`.
2. Confirm **lib/** exists on the deployed branch (see §2).
3. Do not remove the `webpack` block from **next.config.mjs** or change the build script away from `next build --webpack` unless you fix path resolution another way.

---

## Summary

| Check | Action |
|-------|--------|
| Root Directory | Set to the folder that contains `package.json` and `lib/` (e.g. `stem-face-dashboard/nextjs-dashboard` or leave empty if repo root is the app). |
| Branch content | Ensure `lib/` and the rest of the app are committed and pushed to the branch you deploy (e.g. **version2**). |
| baseUrl | Keep `"baseUrl": "."` in **tsconfig.json**. |
| Build / alias | Use **Webpack** for the build. **vercel.json** sets `"buildCommand": "npx next build --webpack"` so Vercel always uses Webpack (and our aliases). Keep the `@` alias in **next.config.mjs**. Do not remove `--webpack` or Turbopack will run and break `@/lib/*` resolution. |

After fixing Root Directory and/or pushing the missing files, trigger a new deployment on Vercel.

---

## 5. ENOENT: page_client-reference-manifest.js (route conflict)

If the build fails at **"Collecting build traces"** with:

`ENOENT: no such file or directory, lstat '.../app/(dashboard)/page_client-reference-manifest.js'`

**Cause:** Route groups like `(dashboard)` do not add URL segments. So `app/page.tsx` and `app/(dashboard)/page.tsx` both map to **`/`**, which is invalid and breaks manifest generation.

**Fix:** Have only one page for `/`. This project uses `app/page.tsx` for `/` (redirect to login). Do **not** add `app/(dashboard)/page.tsx`; use `app/(dashboard)/dashboard/page.tsx` for the `/dashboard` route instead.
