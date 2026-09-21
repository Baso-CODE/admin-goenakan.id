"use client";

import { useApi } from "@/hooks/useApi";
import { useCallback, useRef, useState } from "react";

type CloudinarySignatureResponse = {
  data: {
    apiKey: string;
    timestamp: string | number;
    signature: string;
    folder: string;
    cloudName: string;
  };
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id?: string;
  resource_type?: string;
  format?: string;
};

const SIGNATURE_TIMEOUT = 15_000; // 15 detik
const CLOUDINARY_TIMEOUT = 120_000; // 2 menit, karena bisa upload video

export const useCloudinaryUpload = () => {
  const { fetchApi } = useApi();

  /*
   * Jangan hanya memakai boolean.
   *
   * Karena uploadFile() bisa dipanggil bersamaan:
   *
   * uploadFile(hero)
   * uploadFile(media1)
   * uploadFile(media2)
   *
   * Kita hitung berapa upload yang sedang aktif.
   */
  const activeUploadsRef = useRef(0);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);

  const startUpload = useCallback(() => {
    activeUploadsRef.current += 1;

    setUploadCount(activeUploadsRef.current);
    setIsUploading(true);
  }, []);

  const finishUpload = useCallback(() => {
    activeUploadsRef.current = Math.max(0, activeUploadsRef.current - 1);

    setUploadCount(activeUploadsRef.current);

    if (activeUploadsRef.current === 0) {
      setIsUploading(false);
    }
  }, []);

  const uploadFile = useCallback(
    async (file: File, folder: string = "general"): Promise<string> => {
      startUpload();

      const uploadId = `${file.name}-${Date.now()}`;

      console.time(`☁️ CLOUDINARY ${uploadId}`);

      try {
        /*
         * =========================================
         * 1. VALIDASI FILE
         * =========================================
         */

        if (!file) {
          throw new Error("File tidak ditemukan.");
        }

        if (file.size <= 0) {
          throw new Error("File kosong dan tidak dapat diunggah.");
        }

        /*
         * =========================================
         * 2. MINTA SIGNATURE KE BACKEND
         * =========================================
         */

        console.log("🔐 Meminta signature Cloudinary:", {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          folder,
        });

        const signatureController = new AbortController();

        const signatureTimeout = setTimeout(() => {
          signatureController.abort();
        }, SIGNATURE_TIMEOUT);

        let sigRes: Response;

        try {
          sigRes = await fetchApi(
            `/uploads/signature?folder=${encodeURIComponent(folder)}`,
            {
              signal: signatureController.signal,
            },
          );
        } finally {
          clearTimeout(signatureTimeout);
        }

        if (!sigRes.ok) {
          const errorBody = await sigRes.json().catch(() => null);

          console.error("❌ Signature API Error:", errorBody);

          throw new Error(
            errorBody?.message ||
              `Gagal mendapatkan signature dari server (${sigRes.status})`,
          );
        }

        const sigJson = (await sigRes.json()) as CloudinarySignatureResponse;

        const sigData = sigJson.data;

        if (
          !sigData?.apiKey ||
          !sigData?.timestamp ||
          !sigData?.signature ||
          !sigData?.folder ||
          !sigData?.cloudName
        ) {
          throw new Error("Response signature Cloudinary tidak lengkap.");
        }

        console.log("✅ Signature Cloudinary diterima");

        /*
         * =========================================
         * 3. SIAPKAN FORM DATA CLOUDINARY
         * =========================================
         */

        const formData = new FormData();

        formData.append("file", file);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", String(sigData.timestamp));
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);

        /*
         * =========================================
         * 4. UPLOAD LANGSUNG KE CLOUDINARY
         * =========================================
         */

        console.log("⬆️ Mulai upload ke Cloudinary:", {
          fileName: file.name,
          sizeMB: (file.size / 1024 / 1024).toFixed(2),
        });

        const cloudinaryController = new AbortController();

        const cloudinaryTimeout = setTimeout(() => {
          cloudinaryController.abort();
        }, CLOUDINARY_TIMEOUT);

        let uploadRes: Response;

        try {
          uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`,
            {
              method: "POST",
              body: formData,
              signal: cloudinaryController.signal,
            },
          );
        } finally {
          clearTimeout(cloudinaryTimeout);
        }

        if (!uploadRes.ok) {
          const cloudinaryError = await uploadRes.json().catch(() => null);

          console.error("❌ Cloudinary API Error:", cloudinaryError);

          throw new Error(
            cloudinaryError?.error?.message ||
              `Gagal mengunggah file ke Cloudinary (${uploadRes.status})`,
          );
        }

        const uploadData = (await uploadRes.json()) as CloudinaryUploadResponse;

        if (!uploadData.secure_url) {
          throw new Error("Cloudinary tidak mengembalikan secure_url.");
        }

        console.log("✅ Upload Cloudinary selesai:", {
          fileName: file.name,
          url: uploadData.secure_url,
          publicId: uploadData.public_id,
        });

        return uploadData.secure_url;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          console.error("⏱️ Upload Cloudinary timeout:", file.name);

          throw new Error(
            `Upload "${file.name}" terlalu lama dan dihentikan. Silakan coba lagi.`,
          );
        }

        console.error("❌ Cloudinary Upload Error:", error);

        throw error;
      } finally {
        finishUpload();

        console.timeEnd(`☁️ CLOUDINARY ${uploadId}`);
      }
    },
    [fetchApi, finishUpload, startUpload],
  );

  return {
    uploadFile,
    isUploading,
    uploadCount,
  };
};
