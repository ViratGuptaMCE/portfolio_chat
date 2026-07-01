"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { signUp } from "../../../lib/auth-client";

if (typeof window !== "undefined") {
  import("@material/web/button/filled-button.js");
  import("@material/web/button/text-button.js");
  import("@material/web/textfield/outlined-text-field.js");
  import("@material/web/icon/icon.js");
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await signUp.email({
        name,
        email,
        password,
      });
      
      if (error) {
        setError(error.message || "Failed to create account. Please try again.");
      } else {
        // Redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.article 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md p-8 bg-surface-container text-on-surface rounded-3xl flex flex-col gap-6 shadow-sm border border-outline-variant/30"
      >
        <header className="text-center">
          <h1 className="text-headline-medium font-medium mb-2">Create Account</h1>
          <p className="text-body-large text-on-surface-variant">Join PortfolioChat today.</p>
        </header>

        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-lg text-body-medium flex items-center gap-2">
            <md-icon style={{ fontSize: 18 }}>error</md-icon>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <md-outlined-text-field
            suppressHydrationWarning
            label="Full Name"
            type="text"
            value={name}
            onInput={(e) => setName(e.target.value)}
            required
            className="w-full"
          ></md-outlined-text-field>

          <md-outlined-text-field
            suppressHydrationWarning
            label="Email Address"
            type="email"
            value={email}
            onInput={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          ></md-outlined-text-field>

          <md-outlined-text-field
            suppressHydrationWarning
            label="Password"
            type="password"
            value={password}
            onInput={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          ></md-outlined-text-field>

          <div className="flex flex-col gap-3 mt-4">
            <md-filled-button suppressHydrationWarning type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Creating account..." : "Sign Up"}
              {!loading && <md-icon suppressHydrationWarning slot="icon">person_add</md-icon>}
            </md-filled-button>

            <md-text-button suppressHydrationWarning type="button" onClick={() => window.location.href = "/login"} style={{ width: "100%" }}>
              Already have an account? Sign In
            </md-text-button>
          </div>
        </form>
      </motion.article>
    </main>
  );
}
