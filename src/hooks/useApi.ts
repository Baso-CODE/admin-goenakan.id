"use client";

import { apiUrl } from "@/helper/apiurl";
import { getSession, signOut, useSession } from "next-auth/react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

type ApiErrorResponse = {
  code?: string;
  message?: string;
};

export function useApi() {
  const { data: session, status, update } = useSession();

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const getAccessToken = useCallback(async () => {
    const memoryToken = sessionRef.current?.user?.accessToken;

    if (memoryToken) {
      return memoryToken;
    }

    const currentSession = await getSession();

    if (currentSession) {
      sessionRef.current = currentSession;
    }

    return currentSession?.user?.accessToken;
  }, []);

  const refreshSession = useCallback(async () => {
    const updatedSession = await update();

    if (updatedSession) {
      sessionRef.current = updatedSession;
      return updatedSession.user?.accessToken;
    }

    const currentSession = await getSession();

    if (currentSession) {
      sessionRef.current = currentSession;
    }

    return currentSession?.user?.accessToken;
  }, [update]);

  const performRequest = useCallback(
    async (endpoint: string, options: RequestInit, accessToken?: string) => {
      const headers = new Headers(options.headers || {});

      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }

      if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }

      return fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers,
      });
    },
    [],
  );

  const getErrorData = useCallback(
    async (response: Response): Promise<ApiErrorResponse> => {
      try {
        return await response.clone().json();
      } catch {
        return {};
      }
    },
    [],
  );

  const fetchApi = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      let currentToken = await getAccessToken();

      let response = await performRequest(endpoint, options, currentToken);

      // =========================
      // SUCCESS / ERROR NON-AUTH
      // =========================
      if (response.status !== 401 && response.status !== 403) {
        return response;
      }

      let errorData = await getErrorData(response);

      // =========================
      // 403 FORBIDDEN
      // =========================
      if (response.status === 403) {
        toast.error(
          errorData.message ||
            "Anda tidak memiliki akses untuk melakukan tindakan ini.",
        );

        return response;
      }

      // =========================
      // 401 PERMISSION STALE
      // =========================
      if (errorData.code === "PERMISSION_VERSION_STALE") {
        try {
          const refreshedToken = await refreshSession();

          if (!refreshedToken) {
            throw new Error("Gagal mendapatkan session terbaru");
          }

          currentToken = refreshedToken;

          response = await performRequest(endpoint, options, currentToken);

          // Setelah retry, cek lagi error terbaru
          if (response.status === 401 || response.status === 403) {
            errorData = await getErrorData(response);
          }

          // Permission terbaru ternyata tidak mengizinkan
          if (response.status === 403) {
            toast.error(
              errorData.message ||
                "Hak akses Anda untuk fitur ini telah dicabut.",
            );

            return response;
          }

          // Session masih invalid setelah refresh
          if (response.status === 401) {
            toast.error("Sesi Anda sudah tidak valid. Silakan login kembali.");

            await signOut({
              callbackUrl: "/login",
            });

            throw new Error("Unauthorized after session refresh");
          }

          return response;
        } catch (error) {
          console.error("Failed to refresh permission session:", error);

          toast.error("Sesi tidak dapat diperbarui. Silakan login kembali.");

          await signOut({
            callbackUrl: "/login",
          });

          throw error;
        }
      }

      // =========================
      // 401 BIASA
      // =========================
      toast.error(
        errorData.message || "Sesi Anda telah berakhir, silakan login kembali.",
      );

      await signOut({
        callbackUrl: "/login",
      });

      throw new Error(
        errorData.message || "Unauthorized: Token expired or missing",
      );
    },
    [getAccessToken, getErrorData, performRequest, refreshSession],
  );

  return {
    fetchApi,
    status,
  };
}
