"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import { z } from "zod";

import { ImageCropper } from "@/helper/image-cropper";
import { useApi } from "@/hooks/useApi";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import {
  ClipboardList,
  ImageIcon,
  Loader2,
  Type,
  UploadCloud,
  Video,
} from "lucide-react";
import { toast } from "sonner";

// === SKEMA VALIDASI ZOD (Hanya untuk ID) ===
const storySchema = z.object({
  titleId: z.string().min(5, "Judul (ID) minimal 5 karakter"),
  clientId: z.string().min(1, "Client wajib dipilih"),
  sideContentHtmlId: z.string().optional(),
  mainContentHtmlId: z.string().optional(),
});

export type SuccessStoryFormValues = z.infer<typeof storySchema>;

type ClientData = {
  id: string;
  name: string;
};

export default function SuccessStoryForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: SuccessStoryFormValues & {
    heroImageUrl?: string;
    media1Url?: string;
    media2Url?: string;
  };
  onSubmit: (
    data: SuccessStoryFormValues & {
      heroImageUrl?: string;
      media1Url?: string;
      media2Url?: string;
    },
  ) => Promise<void>;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const { fetchApi } = useApi();

  const { uploadFile, isUploading: isUploadingToCloudinary } =
    useCloudinaryUpload();

  const [clients, setClients] = useState<ClientData[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // === STATES UNTUK PREVIEW FILE ===
  const [previewHero, setPreviewHero] = useState<string | null>(
    initialData?.heroImageUrl || null,
  );
  const [previewMedia1, setPreviewMedia1] = useState<string | null>(
    initialData?.media1Url || null,
  );
  const [previewMedia2, setPreviewMedia2] = useState<string | null>(
    initialData?.media2Url || null,
  );

  const [selectedHero, setSelectedHero] = useState<File | undefined>();
  const [selectedMedia1, setSelectedMedia1] = useState<File | undefined>();
  const [selectedMedia2, setSelectedMedia2] = useState<File | undefined>();

  const form = useForm<SuccessStoryFormValues>({
    resolver: zodResolver(storySchema) as Resolver<SuccessStoryFormValues>,
    defaultValues: initialData ?? {
      titleId: "",
      clientId: "",
      sideContentHtmlId: "",
      mainContentHtmlId: "",
    },
    mode: "onBlur",
  });

  const { isSubmitting: formIsSubmitting } = form.formState;
  const isCurrentlySubmitting =
    isLoading || isSubmitting || formIsSubmitting || isUploadingToCloudinary;

  useEffect(() => {
    const getClients = async () => {
      try {
        const res = await fetchApi("/clients/order");
        if (res.ok) {
          const json = await res.json();
          setClients(json.data || json || []);
        }
      } catch (error) {
        console.error("Gagal memuat client:", error);
      } finally {
        setLoadingClients(false);
      }
    };
    getClients();
  }, [fetchApi]);

  // Handler file
  const handleHeroChange = (file: File) => {
    setSelectedHero(file);
    setPreviewHero(URL.createObjectURL(file));
  };

  const handleMedia1Change = (file: File) => {
    if (file) {
      setSelectedMedia1(file);
      setPreviewMedia1(URL.createObjectURL(file));
    }
  };

  const handleMedia2Change = (file: File) => {
    if (file) {
      setSelectedMedia2(file);
      setPreviewMedia2(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (values: SuccessStoryFormValues) => {
    console.time("🟣 TOTAL_SUCCESS_STORY_SUBMIT");

    try {
      console.log("1️⃣ Submit Success Story dimulai");

      let finalHeroUrl = initialData?.heroImageUrl;
      let finalMedia1Url = initialData?.media1Url;
      let finalMedia2Url = initialData?.media2Url;

      /*
       * ==========================================
       * VALIDASI HERO
       * ==========================================
       */
      if (!selectedHero && !finalHeroUrl) {
        throw new Error("Hero Image wajib diunggah.");
      }

      /*
       * ==========================================
       * UPLOAD MEDIA
       * ==========================================
       */
      console.time("☁️ TOTAL_MEDIA_UPLOAD");

      const [newHeroUrl, newMedia1Url, newMedia2Url] = await Promise.all([
        selectedHero
          ? uploadFile(selectedHero, "success-stories")
          : Promise.resolve(null),
        selectedMedia1
          ? uploadFile(selectedMedia1, "success-stories")
          : Promise.resolve(null),
        selectedMedia2
          ? uploadFile(selectedMedia2, "success-stories")
          : Promise.resolve(null),
      ]);

      console.timeEnd("☁️ TOTAL_MEDIA_UPLOAD");

      /*
       * ==========================================
       * PILIH URL FINAL
       * ==========================================
       */
      if (newHeroUrl) finalHeroUrl = newHeroUrl;
      if (newMedia1Url) finalMedia1Url = newMedia1Url;
      if (newMedia2Url) finalMedia2Url = newMedia2Url;

      if (!finalHeroUrl) {
        throw new Error("Hero Image gagal mendapatkan URL.");
      }

      /*
       * ==========================================
       * CREATE / UPDATE KE BACKEND
       * ==========================================
       */
      console.time("🌐 SUCCESS_STORY_API");

      await onSubmit({
        ...values,
        heroImageUrl: finalHeroUrl,
        media1Url: finalMedia1Url || undefined,
        media2Url: finalMedia2Url || undefined,
      });

      console.timeEnd("🌐 SUCCESS_STORY_API");
    } catch (error) {
      console.error("❌ Success Story Submit Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan Success Story.",
      );
    } finally {
      console.timeEnd("🟣 TOTAL_SUCCESS_STORY_SUBMIT");
    }
  };

  return (
    <Card className="w-full relative">
      {isCurrentlySubmitting && (
        <div className="absolute inset-0 bg-background/80 z-50 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8 w-full">
            {/* === BAGIAN 1: GAMBAR & MEDIA === */}
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">1. Media & Assets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hero Image */}
                <div className="col-span-1 md:col-span-2">
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      Hero Image Banner (Wajib)
                    </FormLabel>
                    <FormControl>
                      <ImageCropper
                        aspectRatio={21 / 9}
                        disabled={isCurrentlySubmitting}
                        onCropComplete={handleHeroChange}>
                        <div className="relative w-full h-48 md:h-64 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors flex flex-col items-center justify-center overflow-hidden group">
                          {previewHero ? (
                            <>
                              <img
                                src={previewHero}
                                alt="Preview Hero"
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white font-medium flex items-center gap-2">
                                  <UploadCloud className="h-5 w-5" /> Ubah
                                  Gambar (Crop Ulang)
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="text-center space-y-2 p-4">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-stone-200">
                                <UploadCloud className="h-6 w-6 text-stone-400" />
                              </div>
                              <div className="text-sm font-medium text-stone-700">
                                Klik untuk unggah Hero Image
                              </div>
                              <p className="text-xs text-stone-500">
                                Otomatis dipotong ke rasio lebar (21:9)
                              </p>
                            </div>
                          )}
                        </div>
                      </ImageCropper>
                    </FormControl>
                  </FormItem>
                </div>

                {/* Media 1 */}
                <div className="col-span-1">
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 mb-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      Media 1 (Foto / Video Opsional)
                    </FormLabel>
                    <FormControl>
                      <ImageCropper
                        aspectRatio={3 / 4}
                        allowVideo={
                          true
                        } /* ✨ PASTIKAN INI ADA agar video bisa dipilih */
                        disabled={isCurrentlySubmitting}
                        onCropComplete={handleMedia1Change}>
                        <div className="relative w-full aspect-[3/4] rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors flex flex-col items-center justify-center overflow-hidden group cursor-pointer">
                          {previewMedia1 ? (
                            <>
                              {/* ✨ LOGIKA BARU: Cek dari tipe file asli, BUKAN dari kata 'blob' */}
                              {selectedMedia1?.type?.startsWith("video/") ||
                              previewMedia1.endsWith(".mp4") ||
                              previewMedia1.includes("video") ? (
                                <video
                                  src={previewMedia1}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={previewMedia1}
                                  alt="Media 1"
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white font-medium flex items-center gap-2">
                                  <UploadCloud className="h-5 w-5" /> Ganti
                                  Media 1
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="text-center space-y-1 p-4">
                              <UploadCloud className="h-6 w-6 text-stone-400 mx-auto" />
                              <span className="text-xs font-medium text-stone-700">
                                Klik untuk pilih Media 1
                              </span>
                              <p className="text-[10px] text-stone-500">
                                Foto otomatis dipotong ke rasio (3:4)
                              </p>
                            </div>
                          )}
                        </div>
                      </ImageCropper>
                    </FormControl>
                  </FormItem>
                </div>

                {/* Media 2 */}
                <div className="col-span-1">
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 mb-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      Media 2 (Foto / Video Opsional)
                    </FormLabel>
                    <FormControl>
                      <ImageCropper
                        aspectRatio={3 / 4}
                        allowVideo={true}
                        disabled={isCurrentlySubmitting}
                        onCropComplete={handleMedia2Change}>
                        <div className="relative w-full aspect-[3/4] rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors flex flex-col items-center justify-center overflow-hidden group cursor-pointer">
                          {previewMedia2 ? (
                            <>
                              {/* ✨ LOGIKA BARU: Cek dari tipe file asli, BUKAN dari kata 'blob' */}
                              {selectedMedia2?.type?.startsWith("video/") ||
                              previewMedia2.endsWith(".mp4") ||
                              previewMedia2.includes("video") ? (
                                <video
                                  src={previewMedia2}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={previewMedia2}
                                  alt="Media 2"
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <p className="text-white font-medium flex items-center gap-2">
                                  <UploadCloud className="h-5 w-5" /> Ganti
                                  Media 2
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="text-center space-y-1 p-4">
                              <UploadCloud className="h-6 w-6 text-stone-400 mx-auto" />
                              <span className="text-xs font-medium text-stone-700">
                                Klik untuk pilih Media 2
                              </span>
                              <p className="text-[10px] text-stone-500">
                                Foto otomatis dipotong ke rasio (3:4)
                              </p>
                            </div>
                          )}
                        </div>
                      </ImageCropper>
                    </FormControl>
                  </FormItem>
                </div>
              </div>
            </div>

            {/* === BAGIAN 2: INFORMASI DASAR === */}
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">
                2. Informasi Dasar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pilih Klien *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingClients || isCurrentlySubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingClients ? "Memuat..." : "Pilih Klien"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="titleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-muted-foreground" />
                          Judul Cerita *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contoh: Sukses bersama PT ABC..."
                            {...field}
                            disabled={isCurrentlySubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* === BAGIAN 3: KONTEN HTML (SIMPLE EDITOR) === */}
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">3. Konten Cerita</h3>

              <div className="grid grid-cols-1 gap-6">
                {/* Side Content ID */}
                <FormField
                  control={form.control}
                  name="sideContentHtmlId"
                  render={({ field }) => (
                    <FormItem className="z-10">
                      <FormLabel>Side Content</FormLabel>
                      <FormControl>
                        <SimpleEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          minHeight="200px"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Main Content ID */}
                <FormField
                  control={form.control}
                  name="mainContentHtmlId"
                  render={({ field }) => (
                    <FormItem className="z-10">
                      <FormLabel>Main Content</FormLabel>
                      <FormControl>
                        <SimpleEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          minHeight="300px"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* === SUBMIT BUTTON === */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto cursor-pointer"
                variant="default"
                disabled={isCurrentlySubmitting}>
                {isCurrentlySubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Success Story" : "Simpan Success Story"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
