/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ["@portfoliochat/db", "better-auth", "drizzle-orm"],
};

export default nextConfig;
