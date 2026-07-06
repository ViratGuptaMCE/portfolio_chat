/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@portfoliochat/db"],
  serverExternalPackages: ["drizzle-orm", "better-auth"],
};

export default nextConfig;
