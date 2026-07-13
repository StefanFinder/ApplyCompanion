/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent webpack from bundling server-only packages
  serverExternalPackages: ['puppeteer', 'docx'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Puppeteer needs these to stay as external
      config.externals = [
        ...config.externals,
        'puppeteer',
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
