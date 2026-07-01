import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

// Initialize Neon Auth Client
// NEON_AUTH_BASE_URL comes from .env.local
export const authClient = createAuthClient(
  process.env.NEXT_PUBLIC_NEON_AUTH_URL || 'https://ep-still-leaf-ats8mxr3.neonauth.c-9.us-east-1.aws.neon.tech/neondb/auth',
  { adapter: BetterAuthReactAdapter() }
);

export const { signIn, signUp, signOut, useSession } = authClient;
