"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API, apiFetch } from "@/lib/api";
import type { ResetPasswordBody } from "@/lib/api";

const STORAGE_KEY = "ecg5000_reset_token";

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken]                     = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass]               = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);
  const [shake, setShake]                     = useState(false);
  const [mounted, setMounted]                 = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Try token from URL (email link click)
    const urlToken = searchParams.get("token");
    if (urlToken) {
      // Save to sessionStorage so refreshes still work
      sessionStorage.setItem(STORAGE_KEY, urlToken);
      setToken(urlToken);
      // Clean token from URL bar without page reload
      window.history.replaceState({}, "", "/reset-password");
      return;
    }

    // 2. Fallback: read from sessionStorage (if user refreshed page)
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setToken(stored);
    }
  }, [searchParams]);

  function triggerShake(msg: string) {
    setError(msg); setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token)                         return triggerShake("No reset token found. Please use the link from your email.");
    if (newPassword.length < 8)         return triggerShake("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return triggerShake("Passwords do not match.");

    setLoading(true);
    try {
      const body: ResetPasswordBody = { token, new_password: newPassword };
      await apiFetch(API.resetPassword, {
        method: "POST",
        body: JSON.stringify(body),
      });

      // ✅ Clear the token from storage after successful reset
      sessionStorage.removeItem(STORAGE_KEY);
      setToken("");

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      triggerShake(err instanceof Error ? err.message : "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎊</div>
        <h2 style={{
          fontSize: 22, fontWeight: 800, marginBottom: 8,
          background: "linear-gradient(135deg,#68d391,#48bb78)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Password reset!</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
          Your password has been updated successfully.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
          Redirecting you to sign in…
        </p>
        <Link href="/login" style={{
          display: "inline-block", padding: "11px 28px",
          background: "linear-gradient(135deg,#4299e1,#2b6cb0)",
          borderRadius: 10, color: "#fff", textDecoration: "none",
          fontSize: 14, fontWeight: 700,
          boxShadow: "0 4px 20px rgba(66,153,225,0.3)",
        }}>Go to Sign In →</Link>
      </div>
    );
  }

  /* ── No token found ── */
  if (mounted && !token) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔗</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fc8181", marginBottom: 8 }}>
          Invalid or Expired Link
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          This reset link is missing or has expired.<br />
          Please request a new password reset.
        </p>
        <Link href="/forgot-password" style={{
          display: "inline-block", padding: "11px 28px",
          background: "linear-gradient(135deg,#f6ad55,#ed8936)",
          borderRadius: 10, color: "#fff", textDecoration: "none",
          fontSize: 14, fontWeight: 700,
          boxShadow: "0 4px 20px rgba(246,173,85,0.3)",
        }}>Request New Link →</Link>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div style={{ animation: shake ? "shake 0.5s ease" : "none" }}>
      {/* Brand */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 56, height: 56, borderRadius: 16, fontSize: 24, marginBottom: 16,
          background: "linear-gradient(135deg,rgba(72,187,120,0.2),rgba(66,153,225,0.15))",
          border: "1px solid rgba(72,187,120,0.3)",
        }}>🛡️</div>
        <h1 style={{
          fontSize: 24, fontWeight: 800, marginBottom: 6,
          background: "linear-gradient(135deg,#e2e8f0,#68d391)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Set new password</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Choose a strong new password for your account.
        </p>
      </div>

      {/* Token valid badge */}
      {token && (
        <div style={{
          background: "rgba(72,187,120,0.08)", border: "1px solid rgba(72,187,120,0.2)",
          borderRadius: 8, padding: "9px 14px", marginBottom: 20,
          fontSize: 12, color: "#68d391", display: "flex", gap: 8, alignItems: "center",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: "#48bb78",
            display: "inline-block", animation: "pulse-dot 2s infinite", flexShrink: 0,
          }} />
          Reset token verified — enter your new password below.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(252,129,129,0.1)", border: "1px solid rgba(252,129,129,0.3)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 20,
          color: "#fc8181", fontSize: 13, display: "flex", gap: 8, alignItems: "center",
        }}>⚠️ {error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* New password */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
            New password
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.45 }}>🔒</span>
            <input
              type={showPass ? "text" : "password"} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters" required
              style={{
                width: "100%", padding: "12px 42px 12px 42px",
                background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: 10, color: "var(--text-primary)", fontSize: 14,
                outline: "none", fontFamily: "var(--font)",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(72,187,120,0.6)"; e.target.style.background = "var(--bg-input-focus)"; }}
              onBlur={(e)  => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "var(--bg-input)"; }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
          <StrengthBar password={newPassword} />
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
            Confirm new password
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.45 }}>✅</span>
            <input
              type={showPass ? "text" : "password"} value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password" required
              style={{
                width: "100%", padding: "12px 14px 12px 42px",
                background: "var(--bg-input)",
                border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? "rgba(252,129,129,0.5)" : "var(--border)"}`,
                borderRadius: 10, color: "var(--text-primary)", fontSize: 14,
                outline: "none", fontFamily: "var(--font)",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(72,187,120,0.6)"; e.target.style.background = "var(--bg-input-focus)"; }}
              onBlur={(e)  => { e.target.style.borderColor = confirmPassword && confirmPassword !== newPassword ? "rgba(252,129,129,0.5)" : "var(--border)"; e.target.style.background = "var(--bg-input)"; }}
            />
          </div>
          {confirmPassword && confirmPassword !== newPassword && (
            <p style={{ fontSize: 11, color: "#fc8181", marginTop: 4, fontWeight: 500 }}>Passwords do not match</p>
          )}
        </div>

        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "13px", border: "none", borderRadius: 10,
          background: loading ? "rgba(72,187,120,0.3)" : "linear-gradient(135deg,#48bb78,#38a169)",
          color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "var(--font)",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 4px 20px rgba(72,187,120,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(72,187,120,0.5)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 20px rgba(72,187,120,0.35)"; }}
        >
          {loading ? <><Spinner />Resetting password…</> : "Reset Password →"}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0", color: "var(--text-muted)", fontSize: 12 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span>Wrong link?</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <Link href="/forgot-password" style={{
        display: "block", width: "100%", padding: "12px",
        background: "transparent", border: "1px solid var(--border)",
        borderRadius: 10, color: "var(--text-secondary)",
        fontSize: 13, fontWeight: 600, textAlign: "center", textDecoration: "none",
        transition: "border-color 0.2s, color 0.2s, background 0.2s",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(246,173,85,0.5)"; e.currentTarget.style.color = "#f6ad55"; e.currentTarget.style.background = "rgba(246,173,85,0.05)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
      >Request a new reset link</Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",
        background:"radial-gradient(ellipse 700px 400px at 50% 30%, rgba(72,187,120,0.06) 0%, transparent 70%)" }} />
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
        <Suspense fallback={<div style={{ color:"var(--text-secondary)",textAlign:"center",padding:"20px 0" }}>Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(72,187,120,0.5)} 50%{opacity:0.6;box-shadow:0 0 0 6px rgba(72,187,120,0)} }
      `}</style>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = ["", "#fc8181", "#f6ad55", "#68d391", "#48bb78"];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i < score ? colors[score] : "rgba(255,255,255,0.08)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</p>
    </div>
  );
}

function Spinner() {
  return <span style={{ width:16,height:16,display:"inline-block",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite" }} />;
}

const eyeBtn: React.CSSProperties = {
  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer",
  color: "var(--text-secondary)", fontSize: 16, padding: 4,
};
