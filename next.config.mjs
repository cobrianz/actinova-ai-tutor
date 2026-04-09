/** @type {import('next').NextConfig} */
import withPWA from "next-pwa";

const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Polyfill or ignore modules for client-side react-pdf
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    return config;
  },
  serverExternalPackages: ['@react-pdf/renderer', 'puppeteer'],
  pwa: {
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    precacheHomePage: false,
  },
};

export default withPWA(nextConfig);
