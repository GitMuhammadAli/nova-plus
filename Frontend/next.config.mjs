/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Docker deployment
  output: 'standalone',
  
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // External packages for server-side (MongoDB driver)
  serverExternalPackages: ['mongodb'],
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
}

export default nextConfig
