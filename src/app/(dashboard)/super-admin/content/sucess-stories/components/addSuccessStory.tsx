"use client";

import { useApi } from "@/hooks/useApi";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import SuccessStoryForm, { SuccessStoryFormValues } from "./successStoryForm";

export default function AddSuccessStory() {
  const { fetchApi, status } = useApi();

  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddStory = async (
    data: SuccessStoryFormValues & {
      heroImageUrl?: string;
      media1Url?: string;
      media2Url?: string;
    },
  ): Promise<void> => {
    if (status !== "authenticated") {
      toast.error("Sesi login tidak valid. Silakan login kembali.");

      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    console.time("🌐 CREATE_SUCCESS_STORY_REQUEST");

    try {
      /*
       * ==========================================
       * VALIDASI
       * ==========================================
       */

      if (!data.heroImageUrl) {
        throw new Error("Mohon unggah Hero Image terlebih dahulu.");
      }

      console.log("📤 Mengirim Success Story ke backend", {
        titleId: data.titleId,
        clientId: data.clientId,

        hasHeroImage: Boolean(data.heroImageUrl),

        hasMedia1: Boolean(data.media1Url),

        hasMedia2: Boolean(data.media2Url),

        useAutoTranslate: data.useAutoTranslate,
      });

      /*
       * ==========================================
       * REQUEST API
       * ==========================================
       */

      const controller = new AbortController();

      /*
       * Create database seharusnya cepat.
       * 30 detik sudah sangat longgar.
       */
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30_000);

      let res: Response;

      try {
        res = await fetchApi("/success-story", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(data),

          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      /*
       * ==========================================
       * HANDLE ERROR RESPONSE
       * ==========================================
       */

      if (!res.ok) {
        const errData = await res.json().catch(() => null);

        console.error("❌ Create Success Story API Error:", {
          status: res.status,
          body: errData,
        });

        throw new Error(
          errData?.message || `Gagal membuat Success Story (${res.status})`,
        );
      }

      const result = await res.json().catch(() => null);

      console.log("✅ Success Story berhasil dibuat:", result);

      toast.success("Success Story berhasil dibuat!");

      /*
       * ==========================================
       * NAVIGASI
       * ==========================================
       */

      router.push("/super-admin/success-story");

      router.refresh();
    } catch (error) {
      console.error("❌ Create Success Story Error:", error);

      if (error instanceof DOMException && error.name === "AbortError") {
        toast.error(
          "Request terlalu lama. Server tidak memberikan response dalam 30 detik.",
        );

        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan data.",
      );

      /*
       * Penting.
       *
       * Throw kembali supaya SuccessStoryForm tahu
       * bahwa onSubmit gagal.
       */
      throw error;
    } finally {
      console.timeEnd("🌐 CREATE_SUCCESS_STORY_REQUEST");

      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto">
      <Link
        href="/super-admin/success-story"
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
        Kembali ke Daftar
      </Link>

      <h2 className="text-xl font-semibold tracking-tight uppercase mb-6">
        Add Success Story
      </h2>

      <SuccessStoryForm onSubmit={handleAddStory} isSubmitting={isSubmitting} />
    </div>
  );
}
