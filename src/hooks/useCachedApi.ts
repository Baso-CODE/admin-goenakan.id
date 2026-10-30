"use client";

import { useApi } from "@/hooks/useApi";
import { useQuery, type QueryKey } from "@tanstack/react-query";

interface CachedApiOptions {
  staleTime?: number;
  enabled?: boolean;
}

export function useCachedApi<T>(
  queryKey: QueryKey,
  endpoint: string,
  options?: CachedApiOptions,
) {
  const { fetchApi, status } = useApi();

  return useQuery<T>({
    queryKey,

    queryFn: async () => {
      const response = await fetchApi(endpoint);

      if (!response.ok) {
        throw new Error("Gagal mengambil data API");
      }

      return response.json();
    },

    enabled: status === "authenticated" && (options?.enabled ?? true),

    staleTime: options?.staleTime ?? 5 * 60 * 1000,
  });
}
