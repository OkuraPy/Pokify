/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    domains: ['images.unsplash.com', 'ae01.alicdn.com', 'cdn.shopify.com', 'i.imgur.com'],
    unoptimized: true 
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: false,
  output: 'standalone',
  experimental: {
    forceSwcTransforms: true,
  },
  async headers() {
    return [
      {
        source: '/api/reviews/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
