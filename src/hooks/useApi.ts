"use client";

import { apiUrl } from "@/helper/apiurl";
import { signOut, useSession, getSession } from "next-auth/react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

export function useApi() {
  const { data: session, status } = useSession();
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const fetchApi = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      // Prioritaskan token dari memory (useSession) agar tidak membuat request HTTP berulang ke /api/auth/session
      let currentToken = sessionRef.current?.user?.accessToken;

      // Fallback ke getSession() hanya jika session di state React belum tersedia (misal saat inisialisasi cepat)
      if (!currentToken) {
        const currentSession = await getSession();
        currentToken = currentSession?.user?.accessToken;
      }

      const headers = new Headers(options.headers || {});

      if (currentToken) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }

      if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }

      const res = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (res.status === 401) {
        toast.error("Sesi Anda telah berakhir, silakan login kembali.");

        await signOut({ callbackUrl: "/login" });

        throw new Error("Unauthorized: Token expired or missing");
      }

      return res;
    },
    [],
  );

  return { fetchApi, status };
}
