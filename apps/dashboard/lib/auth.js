import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@portfoliochat/db";
import { magicLink } from "better-auth/plugins";
import * as schema from "@portfoliochat/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log(`\n\n[VERIFICATION URL] for ${user.email}:\n${url}\n\n`);
      // Optional: You can implement nodemailer here using your SMTP env vars:
      // import nodemailer from "nodemailer";
      // const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, secure: true, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      // await transporter.sendMail({ from: process.env.SMTP_USER, to: user.email, subject: "Verify your email", html: `<a href="${url}">Verify Email</a>` });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-secret",
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // In production, you would use nodemailer here with your SMTP settings
        console.log(`[MOCK EMAIL] Sending Magic Link to ${email}: ${url}`);
      }
    })
  ]
});
