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
    esmExternals: 'loose',
  },
  webpack: (config) => {
    // Configurar o webpack para ser case-sensitive e resolver o alias @
    config.resolve.symlinks = false;
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.'
    };
    // Corrige o erro do browserslist com Node.js v22
    config.resolve.fallback = {
      ...config.resolve.fallback,
      module: false,
    };
    return config;
  }
};

export default nextConfig; 