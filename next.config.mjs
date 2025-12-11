/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    // Desabilitar proxy temporariamente se causar problemas
    // proxy: false,
  },
  // Enable standalone output for Docker
  output: 'standalone',
};

export default nextConfig;
