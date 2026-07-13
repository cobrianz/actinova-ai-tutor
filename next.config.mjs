/** @type {import('next').NextConfig} */

const nextConfig = {
  turbopack: {},
  serverExternalPackages: ['@react-pdf/renderer', 'puppeteer', 'msedge-tts'],
};

export default nextConfig;
