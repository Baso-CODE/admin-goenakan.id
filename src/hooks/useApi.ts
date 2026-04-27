"use client";

import { apiUrl } from "@/helper/apiurl";
import { useSession } from "next-auth/react";
import { useCallback } from "react"; // ✨ IMPORT INI

export function useApi() {
  const { data: session, status } = useSession(); // ✨ Ambil status juga
  const token = session?.user?.accessToken;

  // ✨ Bungkus dengan useCallback agar stabil saat masuk ke dalam useEffect
  const fetchApi = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }

      const res = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers,
      });

      return res;
    },
    [token], // ✨ Fungsi ini akan otomatis update kalau token berubah
  );

  return { fetchApi, status }; // ✨ Export status agar komponen tahu kapan harus jalan
}
