/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ["@portfoliochat/db"],
  serverExternalPackages: ["drizzle-orm"],
};

export default nextConfig;
