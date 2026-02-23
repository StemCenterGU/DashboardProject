import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence "webpack config but no turbopack config" in Next.js 16; we use --webpack for dev/build.
  turbopack: {},
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
    // Root = directory containing this config file (Next app root when Vercel Root Directory is set)
    const root = path.resolve(__dirname);
    // Our aliases first so they override any existing; then spread existing alias
    const ourAliases = {
      '@': root,
      '@/lib/supabase': path.resolve(root, 'lib/supabase'),
      '@/lib/utils': path.resolve(root, 'lib/utils'),
      '@/lib/auth': path.resolve(root, 'lib/auth'),
      '@/lib/supabase-server': path.resolve(root, 'lib/supabase-server'),
      '@/lib/analytics': path.resolve(root, 'lib/analytics'),
      '@/lib/ml/predictions': path.resolve(root, 'lib/ml/predictions'),
      '@/lib/wconline-sync': path.resolve(root, 'lib/wconline-sync'),
    };
    config.resolve = config.resolve || {};
    config.resolve.alias = { ...config.resolve.alias, ...ourAliases };
    return config;
  },
};

export default nextConfig;
