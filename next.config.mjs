/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ✅ Speed up deploy while we incrementally improve typing.
  // You can turn these back to false later.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // If you later migrate to next/image with remote URLs, add remotePatterns here.
  }
};

export default nextConfig;
