import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // 自定义 webpack 配置（强制使用 webpack）
  webpack: (config, { isServer }) => {
    // 可以在这里添加自定义 webpack 配置
    return config;
  },
  // 设置空的 turbopack 配置以消除警告（实际使用 webpack）
  turbopack: {},
};

export default nextConfig;
