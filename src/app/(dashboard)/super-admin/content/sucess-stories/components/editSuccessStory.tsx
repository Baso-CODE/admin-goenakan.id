"use client";

import { useApi } from "@/hooks/useApi";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import SuccessStoryForm, { SuccessStoryFormValues } from "./successStoryForm";

type SuccessStorySubmitData = SuccessStoryFormValues & {
  heroImageUrl?: string;
  media1Url?: string;
  media2Url?: string;
};

export default function EditSuccessStory() {
  const { fetchApi, status } = useApi();

  const params = useParams();
  const router = useRouter();

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;

  const [storyData, setStoryData] = useState<
    SuccessStorySubmitData | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * ==========================================
   * 1. FETCH EXISTING SUCCESS STORY
   * ==========================================
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        return;
      }

      if (status === "loading") {
        return;
      }

      if (status !== "authenticated") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      console.time("📥 FETCH_SUCCESS_STORY_DETAIL");

      try {
        console.log("📥 Mengambil Success Story:", id);

        const res = await fetchApi(`/success-story/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => null);

          throw new Error(
            errData?.message ||
              `Gagal mengambil data success story (${res.status})`,
          );
        }

        const result = await res.json();
        const data = result.data ?? result;

        console.log("✅ Success Story ditemukan:", data);

        /*
         * ======================================
         * SET INITIAL DATA
         * ======================================
         * Hanya memetakan data bahasa Indonesia.
         * Field bahasa Inggris sudah dihapus.
         */
        setStoryData({
          titleId: data.titleId ?? "",
          clientId: data.clientId ?? "",
          sideContentHtmlId: data.sideContentHtmlId ?? "",
          mainContentHtmlId: data.mainContentHtmlId ?? "",

          heroImageUrl: data.heroImageUrl || undefined,
          media1Url: data.media1Url || undefined,
          media2Url: data.media2Url || undefined,
        });
      } catch (error) {
        console.error("❌ Fetch Success Story Error:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Gagal memuat data success story.",
        );

        // Arahkan ke rute yang benar jika gagal ambil data
        router.push("/super-admin/success-stories");
      } finally {
        console.timeEnd("📥 FETCH_SUCCESS_STORY_DETAIL");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi, router]);

  /*
   * ==========================================
   * 2. HANDLE UPDATE
   * ==========================================
   */
  const handleUpdateStory = async (
    data: SuccessStorySubmitData,
  ): Promise<void> => {
    if (status !== "authenticated") {
      toast.error("Sesi login tidak valid. Silakan login kembali.");
      return;
    }

    if (!id) {
      toast.error("ID Success Story tidak ditemukan.");
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    console.time("🌐 UPDATE_SUCCESS_STORY_REQUEST");

    try {
      if (!data.heroImageUrl) {
        throw new Error("Hero Image wajib tersedia.");
      }

      /*
       * ======================================
       * PAYLOAD JSON
       * ======================================
       * Hanya mengirimkan data bahasa Indonesia
       */
      const payload = {
        titleId: data.titleId,
        clientId: data.clientId,
        sideContentHtmlId: data.sideContentHtmlId || null,
        mainContentHtmlId: data.mainContentHtmlId || null,

        heroImageUrl: data.heroImageUrl,
        media1Url: data.media1Url || null,
        media2Url: data.media2Url || null,
      };

      console.log("📤 Update Success Story:", {
        id,
        titleId: payload.titleId,
        clientId: payload.clientId,
        hasHeroImage: Boolean(payload.heroImageUrl),
        hasMedia1: Boolean(payload.media1Url),
        hasMedia2: Boolean(payload.media2Url),
      });

      /*
       * ======================================
       * TIMEOUT & REQUEST API
       * ======================================
       */
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30_000);

      let res: Response;

      try {
        res = await fetchApi(`/success-story/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      /*
       * ======================================
       * ERROR RESPONSE
       * ======================================
       */
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);

        console.error("❌ Update API Error:", {
          status: res.status,
          body: errJson,
        });

        throw new Error(
          errJson?.message || `Gagal memperbarui Success Story (${res.status})`,
        );
      }

      const result = await res.json().catch(() => null);
      console.log("✅ Success Story berhasil diperbarui:", result);
      toast.success("Success Story berhasil diperbarui!");

      /*
       * ======================================
       * NAVIGATION
       * ======================================
       */
      // Arahkan ke rute yang benar setelah sukses
      router.push("/super-admin/success-stories");
      router.refresh();
    } catch (error) {
      console.error("❌ Update Success Story Error:", error);

      if (error instanceof DOMException && error.name === "AbortError") {
        toast.error(
          "Request update terlalu lama. Server tidak memberikan response dalam 30 detik.",
        );
        throw error;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui Success Story.",
      );

      throw error;
    } finally {
      console.timeEnd("🌐 UPDATE_SUCCESS_STORY_REQUEST");
      setIsSubmitting(false);
    }
  };

  /*
   * ==========================================
   * 3. LOADING INITIAL DATA
   * ==========================================
   */
  if (isLoading) {
    return (
      <div className="flex min-h-75 items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Memuat Success Story...
        </div>
      </div>
    );
  }

  if (!storyData) {
    return null;
  }

  /*
   * ==========================================
   * 4. UI
   * ==========================================
   */
  return (
    <div className="space-y-4 mx-auto">
      {/* Rute Link diperbarui agar konsisten */}
      <Link
        href="/super-admin/success-stories"
        className="
          inline-flex
          items-center
          text-sm
          font-medium
          text-muted-foreground
          hover:text-primary
          mb-2
          transition-colors
        ">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Kembali ke Daftar Success Story
      </Link>

      <h2 className="text-xl font-semibold tracking-tight uppercase mb-6">
        Edit Success Story
      </h2>

      <SuccessStoryForm
        initialData={storyData}
        onSubmit={handleUpdateStory}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
