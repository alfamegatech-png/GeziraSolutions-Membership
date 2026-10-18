/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "standalone",
  experimental: {
    serverActions: true,
  },

  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.node$/,
      use: [
        options.defaultLoaders.babel,
        {
          loader: "node-loader",
        },
      ],
    });

    return config;
  },
};

module.exports = nextConfig;
