import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "10.100.23.151",
    "10.100.23.151:3000",
    "10.110.1.58",
    "10.110.1.58:3000",
    "localhost",
    "localhost:3000",
  ],
};

export default nextConfig;
