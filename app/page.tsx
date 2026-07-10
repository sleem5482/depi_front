"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getStoredUser, clearSession } from "@/lib/api";
import type { MeResponse } from "@/lib/api";

const FEATURES = [
  { icon: "⚡", title: "Real-Time Detection",  desc: "Stream IoT sensor readings and detect anomalies the moment they occur." },
  { icon: "🧠", title: "ML-Powered Engine",    desc: "LSTM Autoencoder & Isolation Forest models with 97%+ AUC-ROC." },
  { icon: "📡", title: "Multi-Sensor Support", desc: "Accelerometer · Gyroscope · Heart Rate · Temperature · Pressure." },
  { icon: "🔔", title: "Smart Alerts",         desc: "Rule-based alerting via email, webhook, or Slack with severity tiers." },
];

const STATS = [
  { value: "97.4%",  label: "AUC-ROC" },
  { value: "92.6%",  label: "F1 Score" },
  { value: "5",      label: "Sensor Types" },
  { value: "<50ms",  label: "Latency" },
];

export default function HomePage() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", fontFamily: "var(--font)" }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 32px",
        background: scrolled ? "rgba(8,11,20,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "background 0.3s, border-color 0.3s, backdrop-filter 0.3s",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg,#4299e1,#9f7aea)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>🔬</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
            PRIDE<span style={{ color: "#63b3ed" }}>.io</span>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/docs" style={navLinkStyle}>API Docs</Link>
          <Link href="/api/health" style={navLinkStyle}>Health</Link>
          <Link href="/predict" style={{
            ...navLinkStyle,
            background: "rgba(66,153,225,0.06)",
            border: "1px solid rgba(66,153,225,0.2)",
            borderRadius: 7,
            padding: "6px 14px",
            color: "#63b3ed",
            fontWeight: 600,
          }}>📈 Predict</Link>

          {user ? (
            <>
              <Link href="/profile" style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "6px 14px", fontSize: 13,
                color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8,
                textDecoration: "none", transition: "background 0.2s, border-color 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(66,153,225,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#48bb78", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
                {user.username}
                <span style={{
                  background: "rgba(72,187,120,0.15)", color: "#68d391",
                  borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700,
                }}>active</span>
              </Link>
              <button onClick={handleLogout} style={{
                background: "rgba(252,129,129,0.08)", border: "1px solid rgba(252,129,129,0.25)",
                borderRadius: 8, padding: "7px 14px", fontSize: 13,
                color: "#fc8181", cursor: "pointer", fontFamily: "var(--font)",
                transition: "background 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(252,129,129,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(252,129,129,0.08)"; }}
              >Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{
                ...navLinkStyle,
                background: "rgba(66,153,225,0.08)",
                border: "1px solid rgba(66,153,225,0.25)",
                borderRadius: 8, padding: "7px 16px",
                color: "#63b3ed", fontWeight: 600,
              }}>Sign in</Link>
              <Link href="/register" style={{
                padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: "linear-gradient(135deg,#9f7aea,#6b46c1)",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 2px 12px rgba(159,122,234,0.35)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(159,122,234,0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(159,122,234,0.35)"; }}
              >Register →</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section style={{
        position: "relative", minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", padding: "120px 24px 80px", overflow: "hidden",
      }}>
        {/* Orb backgrounds */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `
            radial-gradient(ellipse 900px 500px at 50% 0%, rgba(66,153,225,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 600px 400px at 20% 60%, rgba(159,122,234,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 500px 300px at 80% 70%, rgba(72,187,120,0.04) 0%, transparent 70%)`,
        }} />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />

        {/* Status badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(66,153,225,0.08)", border: "1px solid rgba(66,153,225,0.25)",
          borderRadius: 999, padding: "6px 18px", marginBottom: 28,
          color: "#63b3ed", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#48bb78", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
          API v1.0 · Live · PRIDE Dataset
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(36px,6vw,68px)", fontWeight: 900, textAlign: "center",
          lineHeight: 1.08, marginBottom: 22, maxWidth: 800, letterSpacing: "-1.5px",
          background: "linear-gradient(135deg, #e2e8f0 0%, #63b3ed 45%, #9f7aea 80%, #b794f4 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          PRIDE Anomaly<br />Detection Platform
        </h1>

        <p style={{
          color: "var(--text-secondary)", fontSize: 18, textAlign: "center",
          maxWidth: 560, lineHeight: 1.7, marginBottom: 44,
        }}>
          Real-time IoT sensor anomaly detection — accelerometer, gyroscope &amp; heart-rate streams, powered by LSTM &amp; Isolation Forest.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 72 }}>
          {!user ? (
            <>
              <Link href="/register" style={{
                padding: "15px 36px", borderRadius: 14, fontWeight: 800, fontSize: 16,
                background: "linear-gradient(135deg,#9f7aea,#6b46c1)",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 4px 28px rgba(159,122,234,0.45)",
                transition: "transform 0.2s, box-shadow 0.2s",
                display: "flex", alignItems: "center", gap: 10,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 36px rgba(159,122,234,0.6)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 28px rgba(159,122,234,0.45)"; }}
              >
                🚀 Get Started — Register
              </Link>
              <Link href="/login" style={{
                padding: "15px 36px", borderRadius: 14, fontWeight: 700, fontSize: 16,
                background: "rgba(66,153,225,0.1)", border: "1px solid rgba(66,153,225,0.4)",
                color: "#63b3ed", textDecoration: "none",
                transition: "transform 0.2s, background 0.2s, border-color 0.2s",
                display: "flex", alignItems: "center", gap: 10,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "rgba(66,153,225,0.18)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = "rgba(66,153,225,0.1)"; }}
              >
                🔐 Sign In
              </Link>
            </>
          ) : (
            <div style={{
              background: "rgba(72,187,120,0.1)", border: "1px solid rgba(72,187,120,0.3)",
              borderRadius: 14, padding: "16px 28px",
              color: "#68d391", fontSize: 16, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              👋 Welcome back, <strong>{user.username}</strong>! You&apos;re signed in.
            </div>
          )}
          <Link href="/docs" style={{
            padding: "15px 36px", borderRadius: 14, fontWeight: 700, fontSize: 16,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-secondary)", textDecoration: "none",
            transition: "transform 0.2s, background 0.2s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          >
            📄 API Docs
          </Link>
        </div>

        {/* Hero image */}
        <div style={{
          position: "relative", width: "100%", maxWidth: 860,
          borderRadius: 20, overflow: "hidden",
          border: "1px solid rgba(66,153,225,0.2)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(66,153,225,0.08)",
        }}>
          {/* Gradient overlay top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 40, zIndex: 1,
            background: "linear-gradient(to bottom, var(--bg-base), transparent)",
          }} />
          <Image
            src="/hero.png"
            alt="IoT Anomaly Detection Dashboard"
            width={860}
            height={480}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
          {/* Gradient overlay bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 80, zIndex: 1,
            background: "linear-gradient(to top, var(--bg-base), transparent)",
          }} />
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{
        padding: "48px 24px",
        background: "rgba(255,255,255,0.02)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          maxWidth: 760, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24,
        }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "clamp(28px,4vw,42px)", fontWeight: 900,
                background: "linear-gradient(135deg,#63b3ed,#9f7aea)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                marginBottom: 6,
              }}>{s.value}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{
          fontSize: "clamp(24px,3.5vw,36px)", fontWeight: 800, textAlign: "center",
          marginBottom: 12, color: "var(--text-primary)", letterSpacing: "-0.5px",
        }}>Why PRIDE?</h2>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", fontSize: 15, marginBottom: 48 }}>
          Built for real-world IoT safety monitoring with clinical-grade precision.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: "rgba(13,17,30,0.7)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "24px 22px",
              backdropFilter: "blur(10px)",
              transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(66,153,225,0.4)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(66,153,225,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Auth CTA section ── */}
      {!user && (
        <section style={{
          padding: "80px 24px",
          background: "linear-gradient(135deg,rgba(66,153,225,0.04),rgba(159,122,234,0.04))",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🔬</div>
            <h2 style={{
              fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, marginBottom: 14,
              background: "linear-gradient(135deg,#e2e8f0,#b794f4)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Start monitoring your sensors</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
              Create a free account to access the full anomaly detection API, ingest sensor readings,
              and receive smart alerts in real time.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/register" style={{
                padding: "14px 40px", borderRadius: 12, fontWeight: 800, fontSize: 16,
                background: "linear-gradient(135deg,#9f7aea,#6b46c1)",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 4px 24px rgba(159,122,234,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(159,122,234,0.55)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(159,122,234,0.4)"; }}
              >🚀 Create Free Account</Link>
              <Link href="/login" style={{
                padding: "14px 40px", borderRadius: 12, fontWeight: 700, fontSize: 16,
                background: "transparent", border: "1px solid rgba(66,153,225,0.4)",
                color: "#63b3ed", textDecoration: "none",
                transition: "transform 0.2s, background 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "rgba(66,153,225,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = "transparent"; }}
              >🔐 Sign In</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={{
        padding: "32px 24px",
        borderTop: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 24, flexWrap: "wrap",
      }}>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>PRIDE Dataset · Milestone 3 REST API</span>
        <Link href="/api/health"     style={footerLink}>Health Check</Link>
        <Link href="/api/openapi.json" style={footerLink}>OpenAPI JSON</Link>
        <Link href="/docs"           style={footerLink}>Swagger UI</Link>
      </footer>

      <style>{`
        @keyframes pulse-dot {
          0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(72,187,120,0.5)}
          50%{opacity:0.6;box-shadow:0 0 0 6px rgba(72,187,120,0)}
        }
      `}</style>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
  color: "var(--text-secondary)", textDecoration: "none",
  transition: "color 0.2s, background 0.2s",
};

const footerLink: React.CSSProperties = {
  color: "var(--text-muted)", fontSize: 12, textDecoration: "none",
  transition: "color 0.2s",
};
