/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  env: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY,
    NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Add image optimization settings
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['img.clerk.com'],
  },
  // Modern optimization settings
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable React strict mode for better development
  reactStrictMode: true,
  // Disable x-powered-by header for security
  poweredByHeader: false,
  // Enable gzip compression
  compress: true,
  // Webpack specific optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      // Optimize CSS
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss)$/,
        chunks: 'all',
        enforce: true,
      }

      // Optimize chunks
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier());
            },
            name(module) {
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              return crypto
                .createHash('sha1')
                .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                .digest('hex') + (module.type === 'css/mini-extract' ? '_CSS' : '');
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      }

      // Add terser optimization
      config.optimization.minimize = true
      
      // Add module concatenation
      config.optimization.concatenateModules = true
    }

    return config
  },
  // Experimental features for performance
  experimental: {
    optimizeCss: true, // Enable CSS optimization
    scrollRestoration: true, // Better scroll handling
    optimisticClientCache: true,
    serverActions: true,
    serverActionsBodySizeLimit: '2mb',
    serverComponentsExternalPackages: ['sharp'],
  }
}

// Export the configuration with bundle analyzer wrapper
module.exports = withBundleAnalyzer(nextConfig) 

