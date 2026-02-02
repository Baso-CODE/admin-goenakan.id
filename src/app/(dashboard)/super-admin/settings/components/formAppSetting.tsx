"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/helper/apiurl";
import { Loader2, Save } from "lucide-react";

// === SCHEMA VALIDASI ===
const appSettingSchema = z.object({
  googleAdsId: z.string().optional(),
  gtmId: z.string().optional(),
  pixelId: z.string().optional(),
});

type AppSettingValues = z.infer<typeof appSettingSchema>;

export default function AppSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // === FORM INIT ===
  const form = useForm<AppSettingValues>({
    resolver: zodResolver(appSettingSchema),
    defaultValues: {
      googleAdsId: "",
      gtmId: "",
      pixelId: "",
    },
  });

  // === 1. FETCH DATA ===
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Ambil token (sesuai pola auth Anda)
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        // Ganti endpoint sesuai router yang sudah didaftarkan (misal: /app-settings)
        const res = await fetch(`${apiUrl}/app-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch settings");

        const data = await res.json();

        // Populate Form jika data ada
        if (data) {
          form.reset({
            googleAdsId: data.googleAdsId || "",
            gtmId: data.gtmId || "",
            pixelId: data.pixelId || "",
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Gagal memuat pengaturan.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  // === 2. HANDLE SUBMIT (SAVE) ===
  const onSubmit = async (values: AppSettingValues) => {
    setIsSaving(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/app-settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("Pengaturan tracking berhasil disimpan!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6  mx-auto py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tracking & Analytics
        </h1>
        <p className="text-muted-foreground">
          Konfigurasi ID untuk Google Ads, Google Tag Manager, dan Facebook
          Pixel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Configuration</CardTitle>
          <CardDescription>
            Masukkan ID tracking yang diberikan oleh platform iklan. Script akan
            otomatis dipasang di seluruh halaman website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* === GOOGLE ADS ID === */}
              <FormField
                control={form.control}
                name="googleAdsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Ads ID (Measurement ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: AW-123456789" {...field} />
                    </FormControl>
                    <FormDescription>
                      Biasanya diawali dengan 'AW-'. Jangan masukkan script HTML
                      lengkap.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === GOOGLE TAG MANAGER === */}
              <FormField
                control={form.control}
                name="gtmId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Tag Manager ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: GTM-XXXXXX" {...field} />
                    </FormControl>
                    <FormDescription>
                      ID Container GTM Anda. Biarkan kosong jika tidak
                      digunakan.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === FACEBOOK PIXEL === */}
              <FormField
                control={form.control}
                name="pixelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook Pixel ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 88273648273" {...field} />
                    </FormControl>
                    <FormDescription>Hanya angka ID Pixel.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="min-w-37.5">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
