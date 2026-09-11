import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@propr/data-model",
    "@propr/calculations",
    "@propr/finance",
    "@propr/client",
  ],
};

export default nextConfig;
