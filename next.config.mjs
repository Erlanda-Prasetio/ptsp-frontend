/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Render/Netlify deployment
  // output: 'export',
  // trailingSlash: true,
  // images: { unoptimized: true },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  },
  
  // API rewrites for development
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
