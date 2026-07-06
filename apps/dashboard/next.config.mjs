/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ["@portfoliochat/db", "better-auth/react"],
  serverExternalPackages: ["drizzle-orm", "better-auth"],
};

export default nextConfig;
