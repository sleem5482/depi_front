"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API, apiFetch, saveSession, getToken, fetchMe } from "@/lib/api";
import type { AuthResponse, RegisterBody, MeResponse } from "@/lib/api";

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

export default function RegisterPage() {
  const router  = useRouter();
  const [username, setUsername]               = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass]               = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);
  const [shake, setShake]                     = useState(false);
  const [mounted, setMounted]                 = useState(false);

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect to home
    if (getToken()) {
      router.replace("/");
    }
  }, [router]);

  function triggerShake(msg: string) {
    setError(msg); setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim())             return triggerShake("Username is required.");
    if (password !== confirmPassword)  return triggerShake("Passwords do not match.");
    if (password.length < 8)          return triggerShake("Password must be at least 8 characters.");

    setLoading(true);
    try {
      const body: RegisterBody = { username: username.trim(), email, password };

      // Step 1: Register — API returns user info only (no token)
      await apiFetch<MeResponse>(API.register, {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Step 2: Auto-login with the same credentials to get a token
      const loginData = await apiFetch<AuthResponse>(API.login, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (loginData.access_token) {
        localStorage.setItem("pride_token", loginData.access_token);
        try {
          const me = await fetchMe();
          saveSession(loginData.access_token, me);
        } catch {
          if (loginData.user) saveSession(loginData.access_token, loginData.user);
        }
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: unknown) {
      triggerShake(err instanceof Error ? err.message : "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, background: "linear-gradient(135deg,#68d391,#48bb78)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Account created!
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Redirecting you now…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 700px 400px at 80% 20%, rgba(159,122,234,0.07) 0%, transparent 70%), radial-gradient(ellipse 500px 300px at 20% 80%, rgba(72,187,120,0.05) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 460,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 20, padding: "40px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
        opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        animation: shake ? "shake 0.5s ease" : "none",
      }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, fontSize: 24, marginBottom: 16, background: "linear-gradient(135deg,rgba(159,122,234,0.2),rgba(72,187,120,0.15))", border: "1px solid rgba(159,122,234,0.3)" }}>🚀</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, background: "linear-gradient(135deg,#e2e8f0,#b794f4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Create account</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Join PRIDE Anomaly Detection</p>
        </div>

        {error && (
          <div style={{ background: "rgba(252,129,129,0.1)", border: "1px solid rgba(252,129,129,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 20, color: "#fc8181", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Username</label>
            <div style={{ position: "relative" }}>
              <span style={iconStyle}>👤</span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="john_doe" required style={inputStyle}
                onFocus={focusPurple} onBlur={blurInput} />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email address</label>
            <div style={{ position: "relative" }}>
              <span style={iconStyle}>📧</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com" required style={inputStyle}
                onFocus={focusPurple} onBlur={blurInput} />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <span style={iconStyle}>🔑</span>
              <input type={showPass ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters" required
                style={{ ...inputStyle, paddingRight: 42 }}
                onFocus={focusPurple} onBlur={blurInput} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={eyeBtn}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            <StrengthBar password={password} />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Confirm password</label>
            <div style={{ position: "relative" }}>
              <span style={iconStyle}>✅</span>
              <input type={showPass ? "text" : "password"} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password" required
                style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? "rgba(252,129,129,0.5)" : "var(--border)" }}
                onFocus={focusPurple} onBlur={blurInput} />
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p style={{ fontSize: 11, color: "#fc8181", marginTop: 4, fontWeight: 500 }}>Passwords do not match</p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px", border: "none", borderRadius: 10,
            background: loading ? "rgba(159,122,234,0.3)" : "linear-gradient(135deg,#9f7aea,#6b46c1)",
            color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "var(--font)",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 20px rgba(159,122,234,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(159,122,234,0.5)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 20px rgba(159,122,234,0.35)"; }}
          >
            {loading ? <><Spinner />Creating account…</> : "Create Account →"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0", color: "var(--text-muted)", fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span>Already have an account?</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <Link href="/login" style={outlineLinkStyle}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(66,153,225,0.5)"; e.currentTarget.style.color = "#63b3ed"; e.currentTarget.style.background = "rgba(66,153,225,0.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent"; }}
        >Sign in instead</Link>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 11, marginTop: 20 }}>
          Sends: <code style={{ color: "#b794f4", fontSize: 10 }}>POST {API.register}</code>
          <br /><span style={{ opacity: 0.6 }}>Body: username · email · password</span>
        </p>
      </div>

      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}

function Spinner() {
  return <span style={{ width:16,height:16,display:"inline-block",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite" }} />;
}
const labelStyle: React.CSSProperties = { display:"block",fontSize:13,fontWeight:600,color:"var(--text-secondary)",marginBottom:6 };
const iconStyle: React.CSSProperties  = { position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,opacity:0.45,pointerEvents:"none" };
const eyeBtn: React.CSSProperties     = { position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-secondary)",fontSize:16,padding:4 };
const inputStyle: React.CSSProperties = { width:"100%",padding:"12px 14px 12px 42px",background:"var(--bg-input)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text-primary)",fontSize:14,outline:"none",fontFamily:"var(--font)",transition:"border-color 0.2s,background 0.2s" };
const outlineLinkStyle: React.CSSProperties = { display:"block",width:"100%",padding:"13px",background:"transparent",border:"1px solid var(--border)",borderRadius:10,color:"var(--text-secondary)",fontSize:14,fontWeight:600,textAlign:"center",textDecoration:"none",transition:"border-color 0.2s,color 0.2s,background 0.2s" };
const focusPurple = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor="rgba(159,122,234,0.6)"; e.target.style.background="var(--bg-input-focus)"; };
const blurInput   = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor="var(--border)"; e.target.style.background="var(--bg-input)"; };
