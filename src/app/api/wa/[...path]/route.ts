import { authOptions } from "@/lib/authOptions";
import { fetchWaApiRaw, WaApiError } from "@/lib/wa-api";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

function resolveTargetPath(segments: string[]): string {
  if (segments.length === 0) return "/";
  if (segments[0] === "health") {
    return "/health";
  }
  if (segments[0] === "api") {
    return `/${segments.join("/")}`;
  }
  return `/api/v1/${segments.join("/")}`;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  const targetPath = resolveTargetPath(path);
  const search = req.nextUrl.search;
  const fullPath = search ? `${targetPath}${search}` : targetPath;

  try {
    const rawRes = await fetchWaApiRaw(fullPath, {
      method: "GET",
      signal: req.signal,
    });

    const contentType = rawRes.headers.get("content-type") || "";

    // Forward Server-Sent Events (SSE) stream
    if (contentType.includes("text/event-stream")) {
      return new Response(rawRes.body, {
        status: rawRes.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Forward image/png directly (QR code image)
    if (contentType.includes("image/")) {
      const buffer = await rawRes.arrayBuffer();
      return new NextResponse(buffer, {
        status: rawRes.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    if (contentType.includes("application/json")) {
      const data = await rawRes.json();

      // If this is a base64 encoded image (e.g. WAHA QR endpoint returning { mimetype, data })
      if (
        data?.data &&
        typeof data.data === "string" &&
        (data.mimetype?.includes("image/") || data.data.startsWith("iVBORw0KGgo"))
      ) {
        const imageBuffer = Buffer.from(data.data, "base64");
        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            "Content-Type": data.mimetype || "image/png",
            "Cache-Control": "no-store, max-age=0",
          },
        });
      }

      return NextResponse.json(data, { status: rawRes.status });
    }

    const text = await rawRes.text();
    return new NextResponse(text, {
      status: rawRes.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch (err: any) {
    const status = err instanceof WaApiError ? err.status : 500;
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Internal server error contacting WhatsApp API",
        data: err.data || null,
      },
      { status }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  const targetPath = resolveTargetPath(path);
  const search = req.nextUrl.search;
  const fullPath = search ? `${targetPath}${search}` : targetPath;

  let body: any = null;
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      body = JSON.stringify(await req.json());
    } catch {
      body = null;
    }
  } else if (contentType.includes("text/")) {
    body = await req.text();
  }

  try {
    const rawRes = await fetchWaApiRaw(fullPath, {
      method: "POST",
      body,
      headers: body ? { "Content-Type": "application/json" } : {},
    });

    const resContentType = rawRes.headers.get("content-type") || "";
    if (resContentType.includes("application/json")) {
      const data = await rawRes.json();
      return NextResponse.json(data, { status: rawRes.status });
    }

    const text = await rawRes.text();
    return new NextResponse(text, { status: rawRes.status });
  } catch (err: any) {
    const status = err instanceof WaApiError ? err.status : 500;
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Internal server error contacting WhatsApp API",
        data: err.data || null,
      },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  const targetPath = resolveTargetPath(path);
  const search = req.nextUrl.search;
  const fullPath = search ? `${targetPath}${search}` : targetPath;

  try {
    const rawRes = await fetchWaApiRaw(fullPath, {
      method: "DELETE",
    });

    const resContentType = rawRes.headers.get("content-type") || "";
    if (resContentType.includes("application/json")) {
      const data = await rawRes.json();
      return NextResponse.json(data, { status: rawRes.status });
    }

    const text = await rawRes.text();
    return new NextResponse(text, { status: rawRes.status });
  } catch (err: any) {
    const status = err instanceof WaApiError ? err.status : 500;
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Internal server error contacting WhatsApp API",
        data: err.data || null,
      },
      { status }
    );
  }
}
