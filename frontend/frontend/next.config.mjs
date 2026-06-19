/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable SWC minification (faster builds)
  swcMinify: true,

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Path aliases are handled by jsconfig.json, but we can add experimental options
  experimental: {
    optimizePackageImports: ['@radix-ui/react-*', 'lucide-react', 'sonner'],
  },

  // Security & Performance Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects & Rewrites if needed
  async rewrites() {
    return [
      // Example: Proxy API calls to Render backend if needed
      // {
      //   source: '/api/python/:path*',
      //   destination: 'https://architect-artemis.onrender.com/:path*',
      // },
    ];
  },
};

export default nextConfig;
