import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**", // Ini mengizinkan semua path di hostname tersebut
      },
    ],
  },
};

export default nextConfig;
