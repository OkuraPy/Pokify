/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { 
    domains: ['images.unsplash.com', 'ae01.alicdn.com', 'cdn.shopify.com', 'i.imgur.com'],
    unoptimized: true 
  },
  swcMinify: false,
  reactStrictMode: false,
  output: 'standalone',
  webpack: (config, { isServer }) => {
    // Substituir o Recharts pelo nosso arquivo mock
    config.resolve.alias = {
      ...config.resolve.alias,
      'recharts': path.resolve(__dirname, 'recharts.js'),
    };

    // Resolver problemas com fs e path
    config.resolve.fallback = { 
      fs: false, 
      path: false,
      net: false,
      tls: false,
      child_process: false
    };

    // Ignorar erros de require.extensions
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve 'recharts'/
    ];

    return config;
  },
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: [],  // Removemos o Recharts daqui
  }
};

module.exports = nextConfig;
