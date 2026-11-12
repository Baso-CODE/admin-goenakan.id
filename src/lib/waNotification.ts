import { SendWaTemplatePayload, WaTemplateResponse } from "@/types/waPortal.type";
import { fetchWaApi } from "./wa-api";

export * from "@/types/waPortal.type";

/**
 * Standard Canonical Template Codes registered in catha-wa-api
 */
export const WA_TEMPLATE_CODES = {
  SOP_PROGRESS_UPDATE: "SOP_PROGRESS_UPDATE",
  INVOICE_CREATED: "INVOICE_CREATED",
  ORDER_SHIPPED: "ORDER_SHIPPED",
} as const;

/**
 * Reusable, decoupled WhatsApp notification dispatcher.
 * Can be invoked from:
 * 1. Client-side React components (proxies through /api/wa/templates/send using user session)
 * 2. Server-side code (Next.js Server Actions, Route Handlers, background workers) using server WA_API_KEY
 *
 * @example
 * await sendWaTemplateNotification({
 *   to: "081234567890",
 *   templateCode: WA_TEMPLATE_CODES.SOP_PROGRESS_UPDATE,
 *   variables: {
 *     nama_klien: "Budi Santoso",
 *     no_pesanan: "ORD-2026-001",
 *     nama_produk: "Polo Bordir Custom",
 *     tahap: "Sablon Selesai & Lolos QC",
 *     catatan: "Masuk tahap jahit & packing",
 *     estimasi: "Besok jam 15:00",
 *   },
 * });
 */
export async function sendWaTemplateNotification(
  payload: SendWaTemplatePayload
): Promise<WaTemplateResponse> {
  try {
    // 1. Browser runtime: forward through Next.js proxy route
    if (typeof window !== "undefined") {
      const res = await fetch("/api/wa/templates/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.message || data.error || "Gagal mengirim pesan WhatsApp",
          message: data.message,
        };
      }
      return data;
    }

    // 2. Server runtime: direct secure call to Catha WA API middleware
    const result = await fetchWaApi<WaTemplateResponse>("/api/v1/messages/send-template", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Terjadi kesalahan saat memproses notifikasi WhatsApp",
      message: err.message,
    };
  }
}
