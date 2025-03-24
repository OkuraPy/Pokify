/** @type {import('next').NextConfig} */
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
  webpack: (config, { isServer }) => {
    // Impedir que o Recharts seja incluído no bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'recharts': false,
      };
    }

    // Resolver problemas com fs e path
    config.resolve.fallback = { 
      fs: false, 
      path: false,
      net: false,
      tls: false,
      child_process: false
    };

    // Ignorar erros de require.extensions
    config.ignoreWarnings = [/Critical dependency: the request of a dependency is an expression/];

    return config;
  },
  experimental: {
    esmExternals: 'loose',
  }
};

module.exports = nextConfig;
