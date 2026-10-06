import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 silently coerces any `quality` prop not listed here to the
    // nearest allowed value. Add every quality you use.
    qualities: [75],
  },
  async redirects() {
    // The "Where to start" tool was renamed "Frame logic".
    return [{ source: "/tools/start", destination: "/tools/logic", permanent: true }];
  },
};

export default nextConfig;
