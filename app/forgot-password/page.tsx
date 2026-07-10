"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API, apiFetch } from "@/lib/api";
import type { ForgotPasswordBody } from "@/lib/api";

interface ForgotPasswordResponse {
  message: string;
  email: string;
  reset_token: string;
  expires_in: string;
}

const STORAGE_KEY = "ecg5000_reset_token";

export default function ForgotPasswordPage() {
  const router                = useRouter();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: ForgotPasswordBody = { email };
      const data = await apiFetch<ForgotPasswordResponse>(API.forgotPassword, {
        method: "POST",
        body: JSON.stringify(body),
      });
      // Save token to sessionStorage then redirect immediately
      sessionStorage.setItem(STORAGE_KEY, data.reset_token);
      router.push("/reset-password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Form ── */
  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",
        background:"radial-gradient(ellipse 700px 400px at 50% 30%, rgba(66,153,225,0.06) 0%, transparent 70%)" }} />
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)",
        backgroundSize:"48px 48px" }} />

      <div style={{
        width: "100%", maxWidth: 440,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 20, padding: "40px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 16, fontSize: 24, marginBottom: 16,
            background: "linear-gradient(135deg,rgba(246,173,85,0.2),rgba(252,129,129,0.15))",
            border: "1px solid rgba(246,173,85,0.3)",
          }}>🔓</div>
          <h1 style={{
            fontSize: 24, fontWeight: 800, marginBottom: 6,
            background: "linear-gradient(135deg,#e2e8f0,#f6ad55)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Forgot password?</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(252,129,129,0.1)", border: "1px solid rgba(252,129,129,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 20,
            color: "#fc8181", fontSize: 13, display: "flex", gap: 8, alignItems: "center",
          }}>⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
              Email address
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.45 }}>📧</span>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                style={{
                  width: "100%", padding: "12px 14px 12px 42px",
                  background: "var(--bg-input)", border: "1px solid var(--border)",
                  borderRadius: 10, color: "var(--text-primary)", fontSize: 14,
                  outline: "none", fontFamily: "var(--font)",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(246,173,85,0.6)"; e.target.style.background = "var(--bg-input-focus)"; }}
                onBlur={(e) =>  { e.target.style.borderColor = "var(--border)"; e.target.style.background = "var(--bg-input)"; }}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px", border: "none", borderRadius: 10,
            background: loading ? "rgba(246,173,85,0.3)" : "linear-gradient(135deg,#f6ad55,#ed8936)",
            color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "var(--font)",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 20px rgba(246,173,85,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(246,173,85,0.5)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 20px rgba(246,173,85,0.35)"; }}
          >
            {loading ? <><Spinner />Sending link…</> : "Reset Page →"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0", color: "var(--text-muted)", fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span>Remembered?</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <Link href="/login" style={{
          display: "block", width: "100%", padding: "13px",
          background: "transparent", border: "1px solid var(--border)",
          borderRadius: 10, color: "var(--text-secondary)",
          fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none",
          transition: "border-color 0.2s, color 0.2s, background 0.2s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(66,153,225,0.5)"; e.currentTarget.style.color = "#63b3ed"; e.currentTarget.style.background = "rgba(66,153,225,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
        >Back to Sign In</Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Spinner() {
  return <span style={{ width:16,height:16,display:"inline-block",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite" }} />;
}
