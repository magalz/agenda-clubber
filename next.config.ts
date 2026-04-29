import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      // Supabase Storage — CI project
      {
        protocol: "https",
        hostname: "cklqlebgupxmisvopdab.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Supabase Storage — Production project
      {
        protocol: "https",
        hostname: "otftkmphuultbwqcsqwd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
