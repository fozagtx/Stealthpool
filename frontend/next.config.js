/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      root: "/Users/kaizen/Desktop/broto/frontend",
    },
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
    };
    return config;
  },
};

module.exports = nextConfig;
