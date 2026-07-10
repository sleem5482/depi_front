"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

// ── Types ────────────────────────────────────────────────────────────────────
interface PredictionData {
  sample_index: number;
  features: number[];
  isolation_forest: { prediction: number };
  autoencoder: {
    available: boolean;
    reconstruction_mse: number;
    prediction: number;
  };
  real_label: { value: number };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getConsensus(data: PredictionData) {
  const ifPred = data.isolation_forest.prediction;
  const aePred = data.autoencoder.prediction;
  return ifPred === aePred ? ifPred : aePred;
}

function featureColour(v: number): string {
  const clamped = Math.max(-3, Math.min(3, v));
  if (clamped >= 0) {
    const t = clamped / 3;
    return `rgba(${Math.round(66 + t * 33)},${Math.round(153 - t * 31)},${Math.round(225 + t * 9)},${0.25 + t * 0.65})`;
  } else {
    const t = Math.abs(clamped) / 3;
    return `rgba(${Math.round(66 + t * 186)},${Math.round(153 - t * 24)},${Math.round(225 - t * 96)},${0.25 + t * 0.65})`;
  }
}

// ── ECG Canvas ───────────────────────────────────────────────────────────────
function EcgCanvas({ features, isAnomaly }: { features: number[]; isAnomaly: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const gridSm = isAnomaly ? "rgba(252,129,129,0.12)" : "rgba(66,153,225,0.12)";
    const gridBig = isAnomaly ? "rgba(252,129,129,0.22)" : "rgba(66,153,225,0.22)";
    const lineColor = isAnomaly ? "#fc8181" : "#63b3ed";
    const smallCell = 12;

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = gridSm;
    for (let x = 0; x <= W; x += smallCell) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += smallCell) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridBig;
    for (let x = 0; x <= W; x += smallCell * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += smallCell * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const mid = H / 2;
    const step = W / Math.max(features.length - 1, 1);
    const pts: [number, number][] = features.map((v, i) => [i * step, mid - (v / 3) * (H * 0.38)]);

    // Fill
    ctx.beginPath();
    ctx.moveTo(pts[0][0], mid);
    ctx.lineTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    ctx.lineTo(pts[pts.length - 1][0], mid);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, isAnomaly ? "rgba(252,129,129,0.18)" : "rgba(66,153,225,0.18)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.shadowBlur = 8;
    ctx.shadowColor = isAnomaly ? "rgba(252,129,129,0.7)" : "rgba(66,153,225,0.7)";
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // R-peaks
    for (let i = 5; i < pts.length - 5; i++) {
      if (pts[i][1] < pts[i - 2][1] && pts[i][1] < pts[i + 2][1] && pts[i][1] < mid - H * 0.12) {
        ctx.beginPath();
        ctx.arc(pts[i][0], pts[i][1], 3.5, 0, Math.PI * 2);
        ctx.fillStyle = lineColor;
        ctx.shadowBlur = 12;
        ctx.shadowColor = lineColor;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Beat markers
    const beatInterval = Math.round(features.length / 10);
    for (let i = beatInterval; i < features.length; i += beatInterval) {
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, H);
      ctx.strokeStyle = isAnomaly ? "rgba(252,129,129,0.35)" : "rgba(66,153,225,0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = isAnomaly ? "rgba(252,129,129,0.5)" : "rgba(66,153,225,0.5)";
    ctx.fillText("* ECG1", 8, 16);
    ctx.fillText("ECG1 *", W - 52, 16);
    ctx.fillText("[10:00:00]", 8, mid + 14);
    ctx.fillText("[10:00:10]", W - 72, mid + 14);
    ctx.font = "9px Inter, sans-serif";
    ctx.fillText("Grid intervals: 0.2 sec, 0.5 mV (ECG)", W - 195, H - 8);
  }, [features, isAnomaly]);

  return (
    <canvas ref={canvasRef} width={840} height={200}
      style={{ width: "100%", height: "auto", display: "block", borderRadius: 8 }} />
  );
}

// ── MSE Meter ────────────────────────────────────────────────────────────────
function MseMeter({ mse }: { mse: number }) {
  const pct = Math.min((mse / 1.5) * 100, 100);
  const color = mse < 0.5 ? "#48bb78" : mse < 1.0 ? "#f6ad55" : "#fc8181";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 10, color: "var(--text-muted)" }}>
        <span>Reconstruction MSE</span>
        <span style={{ color }}>{mse.toFixed(6)}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s ease", boxShadow: `0 0 8px ${color}88` }} />
      </div>
    </div>
  );
}

// ── Model Card ───────────────────────────────────────────────────────────────
function ModelCard({ label, icon, prediction, detail, accentColor, extra, badge }: {
  label: string; icon: string; prediction: number; detail: string;
  accentColor: string; extra?: React.ReactNode; badge?: React.ReactNode;
}) {
  const borderColor = accentColor === "#48bb78" ? "rgba(72,187,120,0.2)" : "rgba(252,129,129,0.2)";
  return (
    <div style={{
      background: "rgba(13,17,30,0.85)", border: `1px solid ${borderColor}`,
      borderRadius: 16, padding: "20px", backdropFilter: "blur(10px)",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${accentColor}22`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase" as const }}>{label}</span>
        {badge && <span style={{ marginLeft: "auto" }}>{badge}</span>}
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, color: accentColor, lineHeight: 1, marginBottom: 8 }}>
        {prediction}
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)", marginLeft: 8 }}>
          {prediction === 0 ? "Normal" : "Anomaly"}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace", marginBottom: extra ? 12 : 0 }}>{detail}</div>
      {extra}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ color = "#63b3ed" }: { color?: string }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: "50%",
      border: `3px solid ${color}33`,
      borderTop: `3px solid ${color}`,
      animation: "spin 0.7s linear infinite",
      display: "inline-block",
    }} />
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PredictPage() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PredictionData[]>([]);
  const [activeTab, setActiveTab] = useState<"ecg" | "heatmap" | "raw">("ecg");
  const [fetchCount, setFetchCount] = useState(0);
  const [requestTime, setRequestTime] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    setError(null);
    const t0 = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/predict/random`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      const json: PredictionData = await res.json();
      const elapsed = Math.round(performance.now() - t0);
      setRequestTime(elapsed);
      setData(json);
      setFetchCount((c) => c + 1);
      setHistory((h) => [json, ...h].slice(0, 10));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch prediction");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchPrediction();
  }, [fetchPrediction]);

  const consensus = data ? getConsensus(data) : 0;
  const isAnomaly = consensus === 1;
  const statusColor = isAnomaly ? "#fc8181" : "#48bb78";
  const statusBg = isAnomaly ? "rgba(252,129,129,0.08)" : "rgba(72,187,120,0.08)";
  const statusBorder = isAnomaly ? "rgba(252,129,129,0.3)" : "rgba(72,187,120,0.3)";
  const accentColor = isAnomaly ? "#fc8181" : "#63b3ed";
  const accentGradient = isAnomaly
    ? "linear-gradient(135deg,#fc8181,#f56565)"
    : "linear-gradient(135deg,#4299e1,#667eea)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", fontFamily: "var(--font)", paddingBottom: 80 }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, padding: "0 32px",
        background: "rgba(8,11,20,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 60,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#4299e1,#9f7aea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔬</div>
          <span style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
            PRIDE<span style={{ color: "#63b3ed" }}>.io</span>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Endpoint pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(66,153,225,0.08)", border: "1px solid rgba(66,153,225,0.2)", borderRadius: 8, padding: "5px 12px" }}>
            <span style={{ background: "#4299e1", color: "#fff", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 800, letterSpacing: "0.5px" }}>GET</span>
           
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· Predict on a random test sample</span>
          </div>

          {requestTime !== null && (
            <span style={{ fontSize: 11, color: "#48bb78", fontFamily: "monospace", background: "rgba(72,187,120,0.08)", border: "1px solid rgba(72,187,120,0.2)", borderRadius: 6, padding: "4px 10px" }}>
              {requestTime}ms
            </span>
          )}
          <span style={{ background: "rgba(72,187,120,0.15)", color: "#68d391", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>200 OK</span>
          <Link href="/" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none", padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s" }}>← Home</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 24px 0" }}>

        {/* ── Page header + Predict button ── */}
        <div style={{
          opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(20px)",
          transition: "opacity 0.5s, transform 0.5s",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16, marginBottom: 28,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                PRIDE · Anomaly Detection
              </span>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#48bb78", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#48bb78" }}>Live API</span>
            </div>
            <h1 style={{ fontSize: "clamp(22px,3.5vw,30px)", fontWeight: 900, letterSpacing: "-0.8px", color: "var(--text-primary)", marginBottom: 4 }}>
              Prediction Result
              {data && (
                <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 500, color: "var(--text-muted)", letterSpacing: 0 }}>
                  sample #{data.sample_index}
                </span>
              )}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {data ? `${data.features.length} sensor features` : "Fetching from API…"} · Isolation Forest + Autoencoder ensemble
            </p>
          </div>

          {/* ── PREDICT AGAIN BUTTON ── */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <button
              id="predict-again-btn"
              onClick={fetchPrediction}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: 14,
                background: loading ? "rgba(66,153,225,0.1)" : "linear-gradient(135deg,#4299e1,#667eea)",
                color: loading ? "#63b3ed" : "#fff",
                border: loading ? "1px solid rgba(66,153,225,0.3)" : "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font)",
                boxShadow: loading ? "none" : "0 4px 24px rgba(66,153,225,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
                minWidth: 180,
                justifyContent: "center",
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(66,153,225,0.55)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 24px rgba(66,153,225,0.4)"; }}
            >
              {loading ? <Spinner /> : <span style={{ fontSize: 16 }}>🔀</span>}
              {loading ? "Fetching…" : "Predict Random"}
            </button>
            {fetchCount > 0 && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
                {fetchCount} prediction{fetchCount !== 1 ? "s" : ""} made this session
              </div>
            )}
          </div>
        </div>

        {/* ── Error state ── */}
        {error && (
          <div style={{
            background: "rgba(252,129,129,0.08)", border: "1px solid rgba(252,129,129,0.3)",
            borderRadius: 16, padding: "20px 24px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: "#fc8181", marginBottom: 4 }}>Failed to fetch prediction</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "monospace" }}>{error}</div>
            </div>
            <button onClick={fetchPrediction} style={{
              marginLeft: "auto", background: "rgba(252,129,129,0.15)", border: "1px solid rgba(252,129,129,0.3)",
              color: "#fc8181", borderRadius: 8, padding: "8px 16px", cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "var(--font)",
            }}>
              Retry
            </button>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && !data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {[120, 80, 280].map((h, i) => (
              <div key={i} style={{
                height: h, borderRadius: 16, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                animation: "shimmer 2s infinite linear",
                backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
                backgroundSize: "200% 100%",
              }} />
            ))}
          </div>
        )}

        {data && (
          <>
            {/* ── Verdict banner ── */}
            <div style={{
              opacity: loading ? 0.5 : 1, transition: "opacity 0.3s",
              background: statusBg, border: `1px solid ${statusBorder}`,
              borderRadius: 20, padding: "24px 28px",
              display: "flex", alignItems: "center", gap: 24, marginBottom: 20,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: "-50%", right: "-5%", width: 300, height: 300,
                borderRadius: "50%", pointerEvents: "none",
                background: isAnomaly
                  ? "radial-gradient(circle,rgba(252,129,129,0.08) 0%,transparent 70%)"
                  : "radial-gradient(circle,rgba(72,187,120,0.08) 0%,transparent 70%)",
              }} />

              <div style={{
                width: 66, height: 66, borderRadius: 18, background: accentGradient,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, flexShrink: 0,
                boxShadow: isAnomaly ? "0 8px 28px rgba(252,129,129,0.35)" : "0 8px 28px rgba(66,153,225,0.35)",
              }}>
                {isAnomaly ? "⚠️" : "✅"}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "clamp(18px,2.8vw,26px)", fontWeight: 900, color: statusColor, marginBottom: 4, letterSpacing: "-0.5px" }}>
                  {isAnomaly ? "ANOMALY DETECTED" : "NORMAL — No Anomaly"}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                  {isAnomaly
                    ? "Sensor readings deviate significantly from the normal baseline. Immediate review recommended."
                    : "Sensor readings fall within normal operating parameters. Both models agree on the classification."}
                </div>
              </div>

              <div style={{
                flexShrink: 0, textAlign: "center",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, padding: "12px 20px",
              }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: statusColor, lineHeight: 1, marginBottom: 4 }}>{consensus}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>Prediction</div>
              </div>
            </div>

            {/* ── Model cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(195px,1fr))", gap: 12, marginBottom: 20 }}>
              <ModelCard
                label="Isolation Forest" icon="🌲"
                prediction={data.isolation_forest.prediction}
                detail={`score: ${data.isolation_forest.prediction}`}
                accentColor={data.isolation_forest.prediction === 0 ? "#48bb78" : "#fc8181"}
              />
              <ModelCard
                label="Autoencoder" icon="🧠"
                prediction={data.autoencoder.prediction}
                detail={`mse: ${data.autoencoder.reconstruction_mse.toFixed(6)}`}
                accentColor={data.autoencoder.prediction === 0 ? "#48bb78" : "#fc8181"}
                extra={<MseMeter mse={data.autoencoder.reconstruction_mse} />}
              />
              <ModelCard
                label="Ground Truth" icon="🏷️"
                prediction={data.real_label.value}
                detail={`sample #${data.sample_index}`}
                accentColor={data.real_label.value === 0 ? "#48bb78" : "#fc8181"}
                badge={<span style={{ background: "rgba(246,173,85,0.15)", color: "#f6ad55", borderRadius: 4, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>TRUTH</span>}
              />
              <div style={{
                background: "rgba(13,17,30,0.85)", border: "1px solid var(--border)",
                borderRadius: 16, padding: "20px", backdropFilter: "blur(10px)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>🤝</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase" as const }}>Model Agreement</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: data.isolation_forest.prediction === data.autoencoder.prediction ? "#48bb78" : "#f6ad55", marginBottom: 4 }}>
                  {data.isolation_forest.prediction === data.autoencoder.prediction ? "100%" : "50%"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {data.isolation_forest.prediction === data.autoencoder.prediction ? "Both models agree" : "Models disagree"}
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div style={{
              background: "rgba(13,17,30,0.85)", border: "1px solid var(--border)",
              borderRadius: 20, overflow: "hidden", marginBottom: 20,
              opacity: loading ? 0.5 : 1, transition: "opacity 0.3s",
            }}>
              {/* Tab bar */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                {(["ecg", "heatmap", "raw"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: "13px 22px", background: "none", border: "none",
                    borderBottom: activeTab === tab ? `2px solid ${accentColor}` : "2px solid transparent",
                    color: activeTab === tab ? accentColor : "var(--text-muted)",
                    fontFamily: "var(--font)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    transition: "color 0.2s", letterSpacing: "0.3px",
                  }}>
                    {tab === "ecg" && "📈 ECG Waveform"}
                    {tab === "heatmap" && "🎨 Feature Heatmap"}
                    {tab === "raw" && "{ } Raw JSON"}
                  </button>
                ))}
              </div>

              {/* ECG */}
              {activeTab === "ecg" && (
                <div style={{ padding: "22px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>Sensor Signal Visualisation</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{data.features.length} time-steps · 0.2 sec intervals · 0.5 mV (ECG)</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: statusColor, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, animation: "pulse-dot 2s infinite", display: "inline-block" }} />
                      {isAnomaly ? "Anomalous pattern" : "Normal rhythm"}
                    </div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "14px", border: `1px solid ${isAnomaly ? "rgba(252,129,129,0.15)" : "rgba(66,153,225,0.15)"}` }}>
                    <EcgCanvas features={data.features} isAnomaly={isAnomaly} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "var(--text-muted)" }}>
                    <span>0 s</span><span>Time →</span><span>10 s</span>
                  </div>
                </div>
              )}

              {/* Heatmap */}
              {activeTab === "heatmap" && (
                <div style={{ padding: "22px" }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>Feature Heatmap</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Hover a cell to inspect. Blue = positive deviation, Red = negative.</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(48px,1fr))", gap: 4, marginBottom: 14 }}>
                    {data.features.map((v, i) => (
                      <div key={i} title={`F${i}: ${v.toFixed(4)}`}
                        style={{
                          background: featureColour(v), borderRadius: 6, padding: "7px 3px",
                          textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.7)",
                          fontFamily: "monospace", cursor: "default",
                          transition: "transform 0.15s", border: "1px solid rgba(255,255,255,0.05)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.15)"; (e.currentTarget as HTMLDivElement).style.position = "relative"; (e.currentTarget as HTMLDivElement).style.zIndex = "10"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = ""; (e.currentTarget as HTMLDivElement).style.zIndex = ""; }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>F{i}</div>
                        <div>{v.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>−3</span>
                    <div style={{ height: 8, width: 200, borderRadius: 4, background: "linear-gradient(90deg,rgba(252,129,129,0.85) 0%,rgba(66,153,225,0.1) 50%,rgba(66,153,225,0.85) 100%)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>+3</span>
                  </div>
                </div>
              )}

              {/* Raw JSON */}
              {activeTab === "raw" && (
                <div style={{ padding: "22px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Raw API Response</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>GET /predict/random</span>
                      <span style={{ background: "rgba(72,187,120,0.15)", color: "#68d391", borderRadius: 5, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>200 OK</span>
                      {requestTime !== null && <span style={{ fontFamily: "monospace", fontSize: 11, color: "#48bb78" }}>{requestTime}ms</span>}
                    </div>
                  </div>
                  <pre style={{
                    background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: "20px", fontSize: 12, fontFamily: "monospace",
                    color: "#a0aec0", overflow: "auto", maxHeight: 480, lineHeight: 1.7,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {JSON.stringify({
                      ...data,
                      features: `[...${data.features.length} values]`,
                    }, null, 2).replace(/"(\[...[\d]+ values\])"/g, "$1")}
                    {"\n\n// features (first 10):\n"}
                    {JSON.stringify(data.features.slice(0, 10), null, 2)}
                    {"\n// ... and "}
                    {data.features.length - 10}
                    {" more"}
                  </pre>
                </div>
              )}
            </div>

            {/* ── Request info strip ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Returns", val: "0 (normal) or 1 (anomaly)", mono: false },
                { label: "Sample Index", val: `#${data.sample_index}`, mono: true },
                { label: "Feature Vector", val: `${data.features.length}D`, mono: true },
                { label: "Response Time", val: requestTime !== null ? `${requestTime} ms` : "—", mono: true },
                { label: "Total Fetches", val: `${fetchCount}`, mono: true },
              ].map(({ label, val, mono }) => (
                <div key={label} style={{ background: "rgba(13,17,30,0.7)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 15px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", fontFamily: mono ? "monospace" : "inherit" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* ── Prediction history ── */}
            {history.length > 1 && (
              <div style={{ background: "rgba(13,17,30,0.7)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🕐</span> Session History
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>({history.length} predictions)</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {history.map((h, i) => {
                    const c = getConsensus(h);
                    const isA = c === 1;
                    return (
                      <div key={i} title={`Sample #${h.sample_index} → ${c}`}
                        style={{
                          background: isA ? "rgba(252,129,129,0.1)" : "rgba(72,187,120,0.1)",
                          border: `1px solid ${isA ? "rgba(252,129,129,0.3)" : "rgba(72,187,120,0.3)"}`,
                          borderRadius: 8, padding: "6px 12px", fontSize: 11,
                          color: isA ? "#fc8181" : "#68d391", fontWeight: 600,
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                        <span>{isA ? "⚠" : "✓"}</span>
                        <span>#{h.sample_index}</span>
                        {i === 0 && <span style={{ fontSize: 9, opacity: 0.7 }}>latest</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(72,187,120,0.5)}
          50%{opacity:0.6;box-shadow:0 0 0 6px rgba(72,187,120,0)}
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
