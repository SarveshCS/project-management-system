import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/login/student', destination: '/login', permanent: true },
      { source: '/login/teacher', destination: '/login', permanent: true },
      { source: '/login/admin', destination: '/login', permanent: true },
    ];
  },
};

export default nextConfig;
