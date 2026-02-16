import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Rewrite to Flask backend only for specific routes not handled by Next.js
      // Next.js API routes in /app/api/ take precedence
      // Uncomment and modify if you need to proxy specific Flask routes:
      // {
      //   source: '/api/flask/:path*',
      //   destination: 'http://127.0.0.1:5000/api/:path*',
      // },
    ]
  },
  webpack: (config) => {
    // Use cwd so aliases work when build runs from project root (e.g. Vercel Root Directory)
    const root = path.resolve(process.cwd());
    const aliases = {
      ...config.resolve?.alias,
      '@': root,
      // Explicit aliases so @/lib/* resolve reliably on Vercel
      '@/lib/supabase': path.join(root, 'lib', 'supabase'),
      '@/lib/utils': path.join(root, 'lib', 'utils'),
      '@/lib/auth': path.join(root, 'lib', 'auth'),
      '@/lib/supabase-server': path.join(root, 'lib', 'supabase-server'),
      '@/lib/analytics': path.join(root, 'lib', 'analytics'),
      '@/lib/ml/predictions': path.join(root, 'lib', 'ml', 'predictions'),
      '@/lib/wconline-sync': path.join(root, 'lib', 'wconline-sync'),
    };
    config.resolve = config.resolve || {};
    config.resolve.alias = aliases;
    return config;
  },
};

export default nextConfig;
