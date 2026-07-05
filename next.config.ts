import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  webpack(config, { isServer }) {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      lightningcss: path.resolve(
        __dirname,
        "node_modules/lightningcss-linux-x64-gnu/lightningcss.linux-x64-gnu.node"
      ),
    };

    if (isServer) {
      const externals = config.externals || [];
      if (Array.isArray(externals)) {
        config.externals = [
          ...externals,
          ({ request }: { request?: string }, callback: (err?: Error | null, result?: any) => void) => {
            if (request === "lightningcss") {
              return callback(null, "commonjs lightningcss");
            }
            return callback();
          },
        ];
      } else if (typeof externals === "function") {
        const originalExternals = externals;
        config.externals = (context, request, callback) => {
          if (request === "lightningcss") {
            return callback(null, "commonjs lightningcss");
          }
          return originalExternals(context, request, callback);
        };
      }
    }

    return config;
  },
};

export default nextConfig;
