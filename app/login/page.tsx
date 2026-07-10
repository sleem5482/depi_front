"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API, apiFetch, saveSession, getToken, fetchMe } from "@/lib/api";
import type { AuthResponse, LoginBody } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [shake, setShake]           = useState(false);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect to home
    if (getToken()) {
      router.replace("/");
    }
  }, [router]);

  function triggerShake(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: LoginBody = { email, password };
      const data = await apiFetch<AuthResponse>(API.login, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (data.access_token) {
        // Save token first so fetchMe can use it
        localStorage.setItem("ecg5000_token", data.access_token);
        // Fetch user profile from /auth/me
        try {
          const me = await fetchMe();
          saveSession(data.access_token, me);
        } catch {
          // If /me fails, still proceed with token only
        }
      }

      router.push("/");
    } catch (err: unknown) {
      triggerShake(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      {/* Background layers */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 700px 400px at 20% 30%, rgba(66,153,225,0.07) 0%, transparent 70%),
          radial-gradient(ellipse 500px 300px at 80% 70%, rgba(159,122,234,0.07) 0%, transparent 70%)`,
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 440,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 20, padding: "40px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
        position: "relative",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        animation: shake ? "shake 0.5s ease" : "none",
      }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 16, fontSize: 24, marginBottom: 16,
            background: "linear-gradient(135deg, rgba(66,153,225,0.2), rgba(159,122,234,0.2))",
            border: "1px solid rgba(66,153,225,0.3)",
          }}>🔐</div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, marginBottom: 6,
            background: "linear-gradient(135deg, #e2e8f0, #63b3ed)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Welcome back</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Sign in to ECG5000 Anomaly Detection
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: "rgba(252,129,129,0.1)", border: "1px solid rgba(252,129,129,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 20,
            color: "#fc8181", fontSize: 13, display: "flex", gap: 8, alignItems: "center",
          }}>⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
              Email address
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.45 }}>📧</span>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "rgba(66,153,225,0.6)"; e.target.style.background = "var(--bg-input-focus)"; }}
                onBlur={(e)  => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "var(--bg-input)"; }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--blue)", textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.45 }}>🔑</span>
              <input
                type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ ...inputStyle, paddingRight: 42 }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(66,153,225,0.6)"; e.target.style.background = "var(--bg-input-focus)"; }}
                onBlur={(e)  => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "var(--bg-input)"; }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "13px", border: "none", borderRadius: 10,
              background: loading ? "rgba(66,153,225,0.3)" : "linear-gradient(135deg, #4299e1, #2b6cb0)",
              color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "var(--font)",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(66,153,225,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(66,153,225,0.5)"; }}}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 20px rgba(66,153,225,0.35)"; }}
          >
            {loading ? <><Spinner />Signing in…</> : "Sign In →"}
          </button>
        </form>

        <Divider label="New here?" />

        <Link href="/register" style={outlineLink("#9f7aea")}
          onMouseEnter={(e) => applyHover(e.currentTarget, "rgba(159,122,234,0.5)", "#b794f4", "rgba(159,122,234,0.05)")}
          onMouseLeave={(e) => resetHover(e.currentTarget)}
        >Create an account</Link>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 11, marginTop: 20 }}>
          Sends: <code style={{ color: "#63b3ed", fontSize: 10 }}>POST {API.login}</code>
          <br /><span style={{ opacity: 0.6 }}>Body: email · password</span>
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
        }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// ── Shared sub-components & style helpers ─────────────────────────────────────

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16, display: "inline-block", borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0", color: "var(--text-muted)", fontSize: 12 }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span>{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px 12px 42px",
  background: "var(--bg-input)", border: "1px solid var(--border)",
  borderRadius: 10, color: "var(--text-primary)", fontSize: 14,
  outline: "none", fontFamily: "var(--font)",
  transition: "border-color 0.2s, background 0.2s",
};

const eyeBtn: React.CSSProperties = {
  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, padding: 4,
};

function outlineLink(hoverColor: string): React.CSSProperties {
  return {
    display: "block", width: "100%", padding: "13px",
    background: "transparent", border: "1px solid var(--border)",
    borderRadius: 10, color: "var(--text-secondary)",
    fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none",
    transition: "border-color 0.2s, color 0.2s, background 0.2s",
  };
  void hoverColor;
}

function applyHover(el: HTMLElement, border: string, color: string, bg: string) {
  el.style.borderColor = border; el.style.color = color; el.style.background = bg;
}
function resetHover(el: HTMLElement) {
  el.style.borderColor = "var(--border)"; el.style.color = "var(--text-secondary)"; el.style.background = "transparent";
}
