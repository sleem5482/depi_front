import { NextRequest, NextResponse } from "next/server";

const AZURE_URL =
  "https://anomalydetection-c9e2b6abb5hbggb4.francecentral-01.azurewebsites.net";
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? AZURE_URL).replace(/\/$/, "");

// ── Generic proxy handler ─────────────────────────────────────────────────────
async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>
): Promise<NextResponse> {
  const { path } = await params;
  const targetPath = path.join("/");
  const search = request.nextUrl.search ?? "";
  const targetUrl = `${BASE_URL}/${targetPath}${search}`;

  // Forward all headers except 'host' (which must match the target)
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      forwardHeaders.set(key, value);
    }
  });

  const isBodyMethod = !["GET", "HEAD"].includes(request.method.toUpperCase());

  let body: BodyInit | undefined;
  if (isBodyMethod) {
    body = await request.text();
  }

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: forwardHeaders,
    body: isBodyMethod ? body : undefined,
  });

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    // Skip headers that Next.js manages itself
    if (!["content-encoding", "transfer-encoding", "connection"].includes(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  const responseBody = await response.text();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

// ── Export all HTTP methods ───────────────────────────────────────────────────
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}
