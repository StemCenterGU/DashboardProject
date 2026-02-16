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
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
};

export default nextConfig;
