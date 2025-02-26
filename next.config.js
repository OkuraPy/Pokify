/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    domains: ['images.unsplash.com', 'ae01.alicdn.com', 'cdn.shopify.com', 'i.imgur.com'],
    unoptimized: true 
  },
};

module.exports = nextConfig;
