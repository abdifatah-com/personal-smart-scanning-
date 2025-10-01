import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isDev = process.env.NODE_ENV !== "production";

const baseConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["html5-qrcode", "tesseract.js", "@supabase/supabase-js"],
  },
};

export default withPWA({
  dest: "public",
  disable: isDev,
  register: true,
  skipWaiting: true,
})(baseConfig);
