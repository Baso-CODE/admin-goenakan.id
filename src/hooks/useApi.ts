"use client";

import { apiUrl } from "@/helper/apiurl";
import { signOut, useSession, getSession } from "next-auth/react";
import { useCallback } from "react";
import { toast } from "sonner";

export function useApi() {
  const { status } = useSession();

  const fetchApi = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const currentSession = await getSession();
      const currentToken = currentSession?.user?.accessToken;

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
