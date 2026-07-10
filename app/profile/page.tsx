"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, fetchMe, clearSession, getStoredUser } from "@/lib/api";
import type { MeResponse } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    // Try stored user first for instant render, then refresh from API
    const stored = getStoredUser();
    if (stored) setUser(stored);

    fetchMe()
      .then((me) => {
        setUser(me);
        setLoading(false);
      })
      .catch(() => {
        if (!stored) {
          setError("Could not load your profile. Please sign in again.");
        }
        setLoading(false);
      });
  }, [router]);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const avatarInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        fontFamily: "var(--font)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Navbar ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "0 32px",
          background: "rgba(8,11,20,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg,#4299e1,#9f7aea)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🔬
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 16,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            ECG5000<span style={{ color: "#63b3ed" }}>.io</span>
          </span>
        </Link>

        {/* Nav actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/" style={navLinkStyle}>
            ← Home
          </Link>
          <button onClick={handleLogout} style={logoutBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(252,129,129,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(252,129,129,0.08)"; }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Background ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `
            radial-gradient(ellipse 700px 400px at 30% 20%, rgba(66,153,225,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 500px 300px at 70% 70%, rgba(159,122,234,0.06) 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "48px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {loading && !user ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={spinnerStyle} />
            <p style={{ color: "var(--text-secondary)", marginTop: 16, fontSize: 14 }}>
              Loading your profile…
            </p>
          </div>
        ) : error && !user ? (
          <div
            style={{
              background: "rgba(252,129,129,0.1)",
              border: "1px solid rgba(252,129,129,0.3)",
              borderRadius: 16,
              padding: "24px 32px",
              color: "#fc8181",
              fontSize: 15,
              textAlign: "center",
              maxWidth: 420,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            {error}
            <br />
            <Link
              href="/login"
              style={{
                color: "#63b3ed",
                marginTop: 12,
                display: "inline-block",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Go to Sign In →
            </Link>
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              maxWidth: 680,
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            {/* Profile header card */}
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  marginBottom: 32,
                  flexWrap: "wrap",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    background:
                      "linear-gradient(135deg, rgba(66,153,225,0.3), rgba(159,122,234,0.3))",
                    border: "2px solid rgba(66,153,225,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#63b3ed",
                    flexShrink: 0,
                    letterSpacing: "-1px",
                  }}
                >
                  {avatarInitials}
                </div>

                {/* Name & status */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <h1
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      marginBottom: 4,
                      background:
                        "linear-gradient(135deg, #e2e8f0 0%, #63b3ed 60%, #b794f4 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {user?.username}
                  </h1>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 14,
                      marginBottom: 10,
                    }}
                  >
                    {user?.email}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        background: user?.is_active
                          ? "rgba(72,187,120,0.15)"
                          : "rgba(252,129,129,0.1)",
                        color: user?.is_active ? "#68d391" : "#fc8181",
                        border: `1px solid ${user?.is_active ? "rgba(72,187,120,0.3)" : "rgba(252,129,129,0.3)"}`,
                        borderRadius: 999,
                        padding: "3px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: user?.is_active ? "#48bb78" : "#fc8181",
                          display: "inline-block",
                          animation: user?.is_active
                            ? "pulse-dot 2s infinite"
                            : "none",
                        }}
                      />
                      {user?.is_active ? "Active" : "Inactive"}
                    </span>
                    <span
                      style={{
                        background: "rgba(66,153,225,0.1)",
                        color: "#63b3ed",
                        border: "1px solid rgba(66,153,225,0.25)",
                        borderRadius: 999,
                        padding: "3px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      ID #{user?.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                  marginBottom: 28,
                }}
              />

              {/* Info grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                }}
              >
                <InfoField icon="👤" label="Username" value={user?.username ?? "—"} />
                <InfoField icon="📧" label="Email" value={user?.email ?? "—"} />
                <InfoField icon="🆔" label="User ID" value={user ? `#${user.id}` : "—"} />
                <InfoField icon="📅" label="Member Since" value={joinDate} />
                <InfoField
                  icon="✅"
                  label="Account Status"
                  value={user?.is_active ? "Active & Verified" : "Inactive"}
                  valueColor={user?.is_active ? "#68d391" : "#fc8181"}
                />
              </div>
            </div>

            {/* ── Actions card ── */}
            <div style={{ ...cardStyle, marginTop: 16 }}>
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Account Actions
              </h2>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/forgot-password" style={actionBtnOutline}>
                  🔑 Change Password
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    ...actionBtnBase,
                    background: "rgba(252,129,129,0.08)",
                    border: "1px solid rgba(252,129,129,0.25)",
                    color: "#fc8181",
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(252,129,129,0.15)"; e.currentTarget.style.borderColor = "rgba(252,129,129,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(252,129,129,0.08)"; e.currentTarget.style.borderColor = "rgba(252,129,129,0.25)"; }}
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>

            {/* ── API info card ── */}
            <div style={{ ...cardStyle, marginTop: 16 }}>
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                API Token
              </h2>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  wordBreak: "break-all",
                  lineHeight: 1.7,
                }}
              >
                <span style={{ color: "#63b3ed", fontWeight: 600 }}>Bearer </span>
                <span style={{ opacity: 0.6 }}>
                  {getToken()
                    ? getToken()!.slice(0, 40) + "…"
                    : "No token found"}
                </span>
              </div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  marginTop: 8,
                }}
              >
                Use this token in the{" "}
                <code
                  style={{
                    color: "#b794f4",
                    background: "rgba(159,122,234,0.1)",
                    padding: "1px 5px",
                    borderRadius: 4,
                  }}
                >
                  Authorization: Bearer …
                </code>{" "}
                header when calling the API.
              </p>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse-dot {
          0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(72,187,120,0.5)}
          50%{opacity:0.6;box-shadow:0 0 0 6px rgba(72,187,120,0)}
        }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoField({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>{icon}</span> {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: valueColor ?? "var(--text-primary)",
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 20,
  padding: "28px 28px",
  backdropFilter: "blur(20px)",
  boxShadow:
    "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03) inset",
};

const navLinkStyle: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text-secondary)",
  textDecoration: "none",
  transition: "color 0.2s, background 0.2s",
};

const logoutBtnStyle: React.CSSProperties = {
  background: "rgba(252,129,129,0.08)",
  border: "1px solid rgba(252,129,129,0.25)",
  borderRadius: 8,
  padding: "7px 14px",
  fontSize: 13,
  color: "#fc8181",
  cursor: "pointer",
  fontFamily: "var(--font)",
  transition: "background 0.2s",
};

const actionBtnBase: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  transition: "background 0.2s, border-color 0.2s",
};

const actionBtnOutline: React.CSSProperties = {
  ...actionBtnBase,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "var(--text-secondary)",
};

const spinnerStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "3px solid rgba(66,153,225,0.2)",
  borderTopColor: "#4299e1",
  animation: "spin 0.8s linear infinite",
  margin: "0 auto",
};
