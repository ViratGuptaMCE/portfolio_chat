import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@portfoliochat/db";
import { magicLink } from "better-auth/plugins";
import * as schema from "@portfoliochat/db";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmailAsync = async (to, subject, html) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[MAILER WARNING] SMTP credentials not set. Email not sent.");
    return;
  }
  try {
    await transporter.sendMail({
      from: `"PortfolioChat" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[MAILER] Successfully sent email to ${to}`);
  } catch (err) {
    console.error(`[MAILER ERROR] Failed to send email to ${to}:`, err);
  }
};

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
    sendResetPassword: async ({ user, url, token }) => {
      console.log(`\n\n[RESET PASSWORD URL] for ${user.email}:\n${url}\n\n`);
      sendEmailAsync(
        user.email,
        "Reset your PortfolioChat Password",
        `
        <div style="font-family: sans-serif; max-w-xl mx-auto p-4">
          <h2 style="color: #111;">Reset Your Password</h2>
          <p style="color: #444;">Please click the button below to reset your password.</p>
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #111; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 16px;">Reset Password</a>
        </div>
        `
      ).catch(console.error);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log(`\n\n[VERIFICATION URL] for ${user.email}:\n${url}\n\n`);
      // Fire and forget to avoid blocking signup request
      sendEmailAsync(
        user.email,
        "Verify your PortfolioChat Account",
        `
        <div style="font-family: sans-serif; max-w-xl mx-auto p-4">
          <h2 style="color: #111;">Welcome to PortfolioChat!</h2>
          <p style="color: #444;">Please click the button below to verify your email address.</p>
          <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #111; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 16px;">Verify Email</a>
        </div>
        `
      ).catch(console.error);
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
        console.log(`\n\n[MAGIC LINK URL] for ${email}:\n${url}\n\n`);
        sendEmailAsync(
          email,
          "Sign in to PortfolioChat",
          `
          <div style="font-family: sans-serif; max-w-xl mx-auto p-4">
            <h2 style="color: #111;">Sign in to PortfolioChat</h2>
            <p style="color: #444;">Click the button below to sign in securely.</p>
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #111; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 16px;">Sign In</a>
          </div>
          `
        ).catch(console.error);
      }
    })
  ]
});
