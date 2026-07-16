/** @type {import('next').NextConfig} */
import CopyPlugin from "copy-webpack-plugin";

const nextConfig = {
  turbopack: {},
  serverExternalPackages: ['@react-pdf/renderer', 'puppeteer', 'msedge-tts'],
  webpack(config, { isServer }) {
    if (!isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
              to: "../public/pdf.worker.min.js",
            },
          ],
        })
      );
    }
    return config;
  },
};

export default nextConfig;
