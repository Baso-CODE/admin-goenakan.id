"use client";

import { apiUrl } from "@/helper/apiurl";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

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

      return res;
    },
    [token],
  );

  return { fetchApi, status };
}
