// ─── API Client ────────────────────────────────────────────────────────────────
// In the browser we route through Next.js's /proxy rewrite to avoid CORS.
// On the server (SSR/RSC) we call the Azure backend directly.

const RAW_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? process.env.BASE_URL ?? "").replace(/\/$/, "");
const BASE_URL =
  typeof window !== "undefined"
    ? "/proxy"   // browser → Next.js proxy → Azure (no CORS)
    : RAW_URL;   // server  → Azure directly


// ── Endpoint map ──────────────────────────────────────────────────────────────
export const API = {
  register:       `${BASE_URL}/auth/register`,
  login:          `${BASE_URL}/auth/login`,
  me:             `${BASE_URL}/auth/me`,
  forgotPassword: `${BASE_URL}/auth/forgot-password`,
  resetPassword:  `${BASE_URL}/auth/reset-password`,
};

// ── Request body types ────────────────────────────────────────────────────────
export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  new_password: string;
}

// ── Response types ────────────────────────────────────────────────────────────
export interface MeResponse {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: MeResponse;
}

// ── Generic fetch wrapper ─────────────────────────────────────────────────────
export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      json?.detail ??
      json?.message ??
      json?.error?.message ??
      `Request failed (${res.status})`;
    throw new Error(String(msg));
  }

  return json as T;
}

// ── Token helpers (client-only) ───────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ecg5000_token");
}

export function saveSession(token: string, user: MeResponse) {
  localStorage.setItem("ecg5000_token", token);
  localStorage.setItem("ecg5000_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("ecg5000_token");
  localStorage.removeItem("ecg5000_user");
}

export function getStoredUser(): MeResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("ecg5000_user");
    return raw ? (JSON.parse(raw) as MeResponse) : null;
  } catch {
    return null;
  }
}

/** Fetch current user from /auth/me using the stored bearer token */
export async function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>(API.me, {
    method: "GET",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}
