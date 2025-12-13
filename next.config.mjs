/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    // Desabilitar proxy temporariamente se causar problemas
    // proxy: false,
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Configurações para permitir processamento simultâneo
  // Next.js já suporta requisições simultâneas por padrão, mas garantimos aqui
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
