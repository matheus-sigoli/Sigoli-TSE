/** @type {import('next').NextConfig} */
const nextConfig = {
  // Site 100% estático (ADR 0001/0003): `next build` gera `out/`, servido pela CDN da Vercel.
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { optimizePackageImports: [] },
};
export default nextConfig;
