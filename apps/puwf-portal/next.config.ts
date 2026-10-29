import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: [
    "@kapas/design-tokens",
    "@kapas/domain",
    "@kapas/localization",
    "@kapas/validation",
  ],
  // API traffic is proxied through app/api/v1/[...path]/route.ts so Set-Cookie
  // from the backend is forwarded to the portal origin (required for staff login).
};

export default nextConfig;
