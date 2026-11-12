import { authOptions } from "@/lib/authOptions";
import { fetchWaApi, WaApiError } from "@/lib/wa-api";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await fetchWaApi("/api/v1/messages/send-template", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof WaApiError ? err.status : 500;
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Gagal mengirim notifikasi template WhatsApp",
        data: err.data || null,
      },
      { status }
    );
  }
}
