/** @type {import('next').NextConfig} */

const nextConfig = {
  turbopack: {},
  serverExternalPackages: ['@react-pdf/renderer', 'puppeteer'],
};

export default nextConfig;
