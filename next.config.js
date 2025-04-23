/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable API routes in production
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // Add the undici alias to resolve configuration
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        'undici': false  // Force use of node's native fetch
      }
    };

    // Add rules to handle Firebase and undici modules
    config.module.rules.push({
      test: /\.(mjs|js|jsx|ts|tsx)$/,
      include: [
        /node_modules\/@firebase/,
        /node_modules\/firebase/,
        /node_modules\/undici/
      ],
      use: {
        loader: 'swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: "ecmascript",
              jsx: true,
              decorators: true,
              privateMethod: true,
              classPrivateProperty: true,
            },
            transform: {
              legacyDecorator: true,
              decoratorMetadata: true,
            },
            target: "es2020",
          }
        }
      }
    });

    return config;
  }
};

module.exports = nextConfig;