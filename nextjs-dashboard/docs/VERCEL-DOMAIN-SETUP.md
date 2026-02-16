# Vercel + maniar.xyz (Cloudflare) Setup

Use a **subdomain** of maniar.xyz for the STEM Face Dashboard on Vercel, with DNS at Cloudflare.

**Suggested subdomain:** `dashboard.maniar.xyz` (or `stem.maniar.xyz` if you prefer).

---

## 1. Deploy the app on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub recommended).
2. **Add New Project** → Import your Git repo (e.g. the repo that contains `stem-face-dashboard`).
3. **Root Directory:** Set to the folder that contains the Next.js app:
   - If the repo root is `stem-face-dashboard`: choose **`nextjs-dashboard`**.
   - If the repo root is `DashboardProject`: choose **`stem-face-dashboard/nextjs-dashboard`** (or whatever path has `package.json` and `next.config.*`).
4. **Environment variables** (add in Vercel project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Optionally: `NEXT_PUBLIC_APP_URL` = `https://dashboard.maniar.xyz` (your chosen subdomain)
5. Deploy. Note the default URL (e.g. `your-project.vercel.app`).

---

## 2. Add your subdomain in Vercel

1. In the Vercel project: **Settings** → **Domains**.
2. Add domain: **`dashboard.maniar.xyz`** (or your chosen subdomain, e.g. `stem.maniar.xyz`).
3. Vercel will show how to configure DNS. Usually:
   - **A** record, or  
   - **CNAME** record: name = your subdomain, value = **`cname.vercel-dns.com`** (or a project-specific target Vercel shows).

Use the value Vercel displays for your project.

---

## 3. Configure DNS in Cloudflare (maniar.xyz)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) and select **maniar.xyz**.
2. Go to **DNS** → **Records**.
3. **Add record:**
   - **Type:** CNAME  
   - **Name:** `dashboard` (for `dashboard.maniar.xyz`; use `stem` for `stem.maniar.xyz`)  
   - **Target:** `cname.vercel-dns.com` (or the exact target Vercel shows)  
   - **Proxy status:** **DNS only** (grey cloud).  
     Turn **off** the orange “Proxied” so the record is grey. Required for Vercel’s SSL to work.
4. Save.

**Cloudflare Tunnel:** For this app you’re using Vercel for hosting, so you don’t need a tunnel for the dashboard. Keep your tunnel for other services if you use it. If you ever want the tunnel in front of Vercel, you’d configure the tunnel to point to your Vercel URL; for a normal setup, the CNAME above is enough.

---

## 4. SSL and propagation

- Vercel will issue SSL for `dashboard.maniar.xyz` once DNS is correct.
- Cloudflare: if you later turn **Proxy on** (orange cloud), set SSL/TLS to **Full** or **Full (strict)** to avoid redirect loops.
- DNS can take a few minutes (often 5–15). If the domain doesn’t work at first, wait and re-check in Vercel **Domains** (it will show status/errors).

---

## 5. Optional: `NEXT_PUBLIC_APP_URL`

In Vercel **Environment Variables**, set:

- **`NEXT_PUBLIC_APP_URL`** = `https://dashboard.maniar.xyz`

Use the same subdomain you chose. This is used for redirects and any “app URL” references.

---

## Checklist

| Step | Action |
|-----|--------|
| 1 | Import repo in Vercel, set **Root Directory** to the `nextjs-dashboard` folder |
| 2 | Add Supabase (and optional) env vars in Vercel |
| 3 | In Vercel **Domains**, add `dashboard.maniar.xyz` (or your subdomain) |
| 4 | In Cloudflare **DNS**, add CNAME `dashboard` → `cname.vercel-dns.com`, **DNS only** |
| 5 | Wait for DNS and Vercel SSL; open `https://dashboard.maniar.xyz` |

---

## Subdomain summary

| Subdomain | Use |
|-----------|-----|
| **dashboard.maniar.xyz** | STEM Face Dashboard (this app) – recommended |
| **stem.maniar.xyz** | Alternative name for the same app |

You only need one; pick one and use it in both Vercel and Cloudflare.
