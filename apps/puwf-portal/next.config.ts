import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@kapas/design-tokens",
    "@kapas/domain",
    "@kapas/localization",
    "@kapas/mock-services",
    "@kapas/validation",
  ],
};

export default nextConfig;
