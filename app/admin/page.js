"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase-client";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function signIn(e) {
    e.preventDefault();
    setMessage("Sending sign-in link...");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the sign-in link.");
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <div style={{ padding: 24, borderRadius: 20, background: "#0f172a", border: "1px solid #1e293b" }}>
        <h1>Admin Sign-In</h1>
        <p style={{ color: "#cbd5e1" }}>
          This is the admin-only entry point for schedule edits, rosters, stats, CSV uploads, and documents.
        </p>
        <form onSubmit={signIn} style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            style={{ padding: 12, borderRadius: 12, border: "1px solid #334155", background: "#020617", color: "white" }}
          />
          <button type="submit" style={{ padding: 12, borderRadius: 12, border: 0, background: "#22d3ee", color: "#082f49", fontWeight: 700 }}>
            Send magic link
          </button>
        </form>
        {message ? <p style={{ marginTop: 16, color: "#67e8f9" }}>{message}</p> : null}
      </div>
    </main>
  );
}
