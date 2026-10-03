/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next' : '.next-production',
  reactStrictMode: false,
  images: {
    domains: ['images.unsplash.com', 'localhost'],
  },
};

export default nextConfig;
