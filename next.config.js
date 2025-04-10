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
  webpack: (config, { isServer }) => {
    // Configurar o webpack para ser case-sensitive
    config.resolve.symlinks = false;
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': config.resolve.alias['@'] || '.'
      };
    }
    return config;
  }
};

module.exports = nextConfig;
