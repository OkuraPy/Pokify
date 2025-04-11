/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual para definir caminhos absolutos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      '@': path.resolve(__dirname)
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