import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.111:3000",
    "http://192.168.1.*:3000"
  ]
};

export default nextConfig;
