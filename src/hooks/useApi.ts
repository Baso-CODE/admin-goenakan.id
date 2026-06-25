"use client";

import { apiUrl } from "@/helper/apiurl";
import { signOut, useSession } from "next-auth/react";
import { useCallback } from "react";
import { toast } from "sonner";

export function useApi() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;

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

      if (res.status === 401) {
        toast.error("Sesi Anda telah berakhir, silakan login kembali.");

        await signOut({ callbackUrl: "/login" });

        throw new Error("Unauthorized: Token expired or missing");
      }

      return res;
    },
    [token],
  );

  return { fetchApi, status };
}
