import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jjwktfsaqszbgtqdlbbf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/image-place/**'
      }
    ]
  }
};

export default nextConfig;
