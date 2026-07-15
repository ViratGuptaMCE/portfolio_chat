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
    throw new Error("SMTP credentials are not configured on the server. Email could not be sent.");
  }
  try {
    await transporter.sendMail({
      from: `"PortfolioChat" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    throw new Error("Failed to send email. Please check server configuration or logs.");
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
      await sendEmailAsync(
        user.email,
        "Reset Your PortfolioChat Password",
        `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background-color:#0a0a0a;padding:32px 40px;text-align:center;">
<div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PortfolioChat</div>
<div style="font-size:11px;font-weight:600;color:#06b6d4;letter-spacing:3px;text-transform:uppercase;margin-top:6px;">Password Reset</div>
</td></tr>

<tr><td style="padding:40px 40px 12px 40px;">
<div style="width:56px;height:56px;border-radius:14px;background-color:#06b6d4;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10V8a6 6 0 0 1 12 0v2" stroke="#fff" stroke-width="2" stroke-linecap="round"/><rect x="4" y="10" width="16" height="11" rx="2" fill="#fff"/><circle cx="12" cy="15.5" r="1.8" fill="#06b6d4"/><rect x="11" y="15.5" width="2" height="3.5" fill="#06b6d4"/></svg>
</div>
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111;text-align:center;letter-spacing:-0.5px;">Forgot your password?</h1>
<p style="margin:0 0 8px;font-size:15px;line-height:24px;color:#555;text-align:center;">No worries &mdash; it happens to the best engineers. Click the button below to set a new password and get back to building.</p>
<p style="margin:0 0 32px;font-size:13px;line-height:20px;color:#999;text-align:center;">This link expires in 24 hours. If you didn&rsquo;t request a reset, you can safely ignore this email.</p>
</td></tr>

<tr><td align="center" style="padding:0 40px 40px 40px;">
<a href="${url}" style="display:inline-block;padding:16px 48px;background-color:#06b6d4;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(6,182,212,0.3);">Reset Password</a>
</td></tr>

<tr><td style="padding:0 40px 40px 40px;">
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f0f0f0;padding-top:24px;">
<tr><td style="font-size:12px;color:#bbb;text-align:center;line-height:18px;">If the button doesn&rsquo;t work, paste this link into your browser:<br><a href="${url}" style="color:#06b6d4;word-break:break-all;text-decoration:none;font-size:11px;">${url}</a></td></tr>
</table>
</td></tr>

<tr><td style="background-color:#fafafa;padding:24px 40px;text-align:center;">
<p style="margin:0;font-size:12px;color:#bbb;">&copy; 2026 PortfolioChat. All rights reserved.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmailAsync(
        user.email,
        "Welcome to PortfolioChat — Verify Your Email",
        `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background-color:#0a0a0a;padding:32px 40px;text-align:center;">
<div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PortfolioChat</div>
<div style="font-size:11px;font-weight:600;color:#06b6d4;letter-spacing:3px;text-transform:uppercase;margin-top:6px;">Email Verification</div>
</td></tr>

<tr><td style="padding:40px 40px 12px 40px;">
<div style="width:56px;height:56px;border-radius:14px;background-color:#06b6d4;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14 9L20 9L15 13L17 20L12 16L7 20L9 13L4 9L10 9Z" fill="#fff"/></svg>
</div>
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111;text-align:center;letter-spacing:-0.5px;">Your AI assistant is ready to meet the world.</h1>
<p style="margin:0 0 8px;font-size:15px;line-height:24px;color:#555;text-align:center;">Just one step left &mdash; confirm your email to unlock your dashboard, upload your portfolio, and deploy a chatbot that never sleeps.</p>
<p style="margin:0 0 32px;font-size:13px;line-height:20px;color:#999;text-align:center;">Welcome aboard, ${user.name || "there"}. Let&rsquo;s bring your work to life.</p>
</td></tr>

<tr><td align="center" style="padding:0 40px 40px 40px;">
<a href="${url}" style="display:inline-block;padding:16px 48px;background-color:#06b6d4;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(6,182,212,0.3);">Verify Email Address</a>
</td></tr>

<tr><td style="padding:0 40px 40px 40px;">
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f0f0f0;padding-top:24px;">
<tr><td style="font-size:12px;color:#bbb;text-align:center;line-height:18px;">If the button doesn&rsquo;t work, paste this link into your browser:<br><a href="${url}" style="color:#06b6d4;word-break:break-all;text-decoration:none;font-size:11px;">${url}</a></td></tr>
</table>
</td></tr>

<tr><td style="background-color:#fafafa;padding:24px 40px;text-align:center;">
<p style="margin:0;font-size:12px;color:#bbb;">&copy; 2026 PortfolioChat. All rights reserved.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
      );
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
        await sendEmailAsync(
          email,
          "Your Secure Sign-In Link — PortfolioChat",
          `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background-color:#0a0a0a;padding:32px 40px;text-align:center;">
<div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PortfolioChat</div>
<div style="font-size:11px;font-weight:600;color:#06b6d4;letter-spacing:3px;text-transform:uppercase;margin-top:6px;">Magic Link Sign-In</div>
</td></tr>

<tr><td style="padding:40px 40px 12px 40px;">
<div style="width:56px;height:56px;border-radius:14px;background-color:#06b6d4;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L4 14H11L9 22L20 10H13L13 2Z" fill="#fff"/></svg>
</div>
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111;text-align:center;letter-spacing:-0.5px;">No password needed.</h1>
<p style="margin:0 0 8px;font-size:15px;line-height:24px;color:#555;text-align:center;">Click the button below to instantly sign in to your PortfolioChat dashboard. This link is single-use and expires shortly for your security.</p>
<p style="margin:0 0 32px;font-size:13px;line-height:20px;color:#999;text-align:center;">Didn&rsquo;t request this? You can safely ignore this email &mdash; your account stays secure.</p>
</td></tr>

<tr><td align="center" style="padding:0 40px 40px 40px;">
<a href="${url}" style="display:inline-block;padding:16px 48px;background-color:#06b6d4;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(6,182,212,0.3);">Sign In Instantly</a>
</td></tr>

<tr><td style="padding:0 40px 40px 40px;">
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f0f0f0;padding-top:24px;">
<tr><td style="font-size:12px;color:#bbb;text-align:center;line-height:18px;">If the button doesn&rsquo;t work, paste this link into your browser:<br><a href="${url}" style="color:#06b6d4;word-break:break-all;text-decoration:none;font-size:11px;">${url}</a></td></tr>
</table>
</td></tr>

<tr><td style="background-color:#fafafa;padding:24px 40px;text-align:center;">
<p style="margin:0;font-size:12px;color:#bbb;">&copy; 2026 PortfolioChat. All rights reserved.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
        );
      }
    })
  ]
});
