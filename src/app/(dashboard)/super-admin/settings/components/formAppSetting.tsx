"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart3, Facebook, Loader2, Save, Search, Tags } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { useApi } from "@/hooks/useApi";

const appSettingSchema = z.object({
  googleAnalyticsId: z.string().optional(),
  googleAnalyticsEnabled: z.boolean(),

  googleAdsId: z.string().optional(),
  googleAdsEnabled: z.boolean(),

  gtmId: z.string().optional(),
  gtmEnabled: z.boolean(),

  googleSiteVerification: z.string().optional(),

  pixelId: z.string().optional(),
  pixelEnabled: z.boolean(),

  microsoftClarityId: z.string().optional(),
  microsoftClarityEnabled: z.boolean(),

  globalForeignPriceAdjuster: z.coerce.number().optional(),
});

type AppSettingValues = z.infer<typeof appSettingSchema>;

type AppSettingResponse = {
  data?: {
    googleAnalyticsId?: string | null;
    googleAnalyticsEnabled?: boolean;

    googleAdsId?: string | null;
    googleAdsEnabled?: boolean;

    gtmId?: string | null;
    gtmEnabled?: boolean;

    googleSiteVerification?: string | null;

    pixelId?: string | null;
    pixelEnabled?: boolean;

    microsoftClarityId?: string | null;
    microsoftClarityEnabled?: boolean;

    globalForeignPriceAdjuster?: number | null;
  };
};

export default function AppSettings() {
  const { fetchApi, status } = useApi();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const hasFetchedSettings = useRef(false);

  const form = useForm<AppSettingValues>({
    resolver: zodResolver(appSettingSchema) as Resolver<AppSettingValues>,
    defaultValues: {
      googleAnalyticsId: "",
      googleAnalyticsEnabled: false,

      googleAdsId: "",
      googleAdsEnabled: false,

      gtmId: "",
      gtmEnabled: false,

      googleSiteVerification: "",

      pixelId: "",
      pixelEnabled: false,

      microsoftClarityId: "",
      microsoftClarityEnabled: false,

      globalForeignPriceAdjuster: 0,
    },
  });

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    if (hasFetchedSettings.current) {
      return;
    }

    hasFetchedSettings.current = true;

    const fetchSettings = async () => {
      try {
        const res = await fetchApi("/app-settings/admin");

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));

          throw new Error(errorData.message || "Failed to fetch settings");
        }

        const response: AppSettingResponse = await res.json();

        const data = response.data;

        if (!data) {
          return;
        }

        form.reset({
          googleAnalyticsId: data.googleAnalyticsId || "",
          googleAnalyticsEnabled: data.googleAnalyticsEnabled ?? false,

          googleAdsId: data.googleAdsId || "",
          googleAdsEnabled: data.googleAdsEnabled ?? false,

          gtmId: data.gtmId || "",
          gtmEnabled: data.gtmEnabled ?? false,

          googleSiteVerification: data.googleSiteVerification || "",

          pixelId: data.pixelId || "",
          pixelEnabled: data.pixelEnabled ?? false,

          microsoftClarityId: data.microsoftClarityId || "",
          microsoftClarityEnabled: data.microsoftClarityEnabled ?? false,

          globalForeignPriceAdjuster: data.globalForeignPriceAdjuster ?? 0,
        });
      } catch (error) {
        console.error("Error fetching settings:", error);

        toast.error(
          error instanceof Error ? error.message : "Gagal memuat pengaturan.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [fetchApi, form, status]);

  const onSubmit = async (values: AppSettingValues) => {
    if (status !== "authenticated") {
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetchApi("/app-settings", {
        method: "PATCH",
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));

        throw new Error(errorData.message || "Failed to save settings");
      }

      try {
        const revalidateRes = await fetch("/api/revalidate/app-settings", {
          method: "POST",
        });

        if (!revalidateRes.ok) {
          console.warn(
            "Settings tersimpan, tetapi cache public gagal direvalidate.",
          );
        }
      } catch (error) {
        console.warn("Gagal melakukan revalidate cache public:", error);
      }

      toast.success("Pengaturan aplikasi berhasil disimpan!");
    } catch (error) {
      console.error("Save Settings Error:", error);

      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan pengaturan.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Application Settings
        </h1>

        <p className="text-muted-foreground">
          Kelola tracking, analytics, verification, dan konfigurasi global
          aplikasi.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Google Analytics
              </CardTitle>

              <CardDescription>
                Tracking traffic dan perilaku pengunjung menggunakan Google
                Analytics 4.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="googleAnalyticsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Google Analytics</FormLabel>

                      <FormDescription>
                        Aktifkan pemasangan Google Analytics pada website.
                      </FormDescription>
                    </div>

                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="googleAnalyticsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurement ID</FormLabel>

                    <FormControl>
                      <Input placeholder="G-XXXXXXXXXX" {...field} />
                    </FormControl>

                    <FormDescription>
                      Measurement ID GA4, biasanya diawali dengan G-.
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Google Tag Manager
              </CardTitle>

              <CardDescription>
                Kelola Google Tag Manager untuk pemasangan tag pihak ketiga.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="gtmEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Google Tag Manager</FormLabel>

                      <FormDescription>
                        Aktifkan GTM pada seluruh halaman website.
                      </FormDescription>
                    </div>

                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gtmId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Container ID</FormLabel>

                    <FormControl>
                      <Input placeholder="GTM-XXXXXXX" {...field} />
                    </FormControl>

                    <FormDescription>
                      Masukkan Container ID, bukan script GTM lengkap.
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Ads</CardTitle>

              <CardDescription>
                Konfigurasi Google Ads untuk conversion tracking dan
                remarketing.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="googleAdsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Google Ads</FormLabel>

                      <FormDescription>
                        Aktifkan global Google Ads tracking.
                      </FormDescription>
                    </div>

                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="googleAdsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Ads ID</FormLabel>

                    <FormControl>
                      <Input placeholder="AW-123456789" {...field} />
                    </FormControl>

                    <FormDescription>
                      Biasanya diawali dengan AW-.
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Google Search Console
              </CardTitle>

              <CardDescription>
                Verifikasi kepemilikan website melalui meta tag Google.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <FormField
                control={form.control}
                name="googleSiteVerification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Token</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Google site verification token"
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      Masukkan hanya nilai dari atribut content, bukan meta tag
                      HTML lengkap.
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="h-5 w-5" />
                Meta Pixel
              </CardTitle>

              <CardDescription>
                Tracking event dan audience Meta Ads menggunakan Pixel.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="pixelEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Meta Pixel</FormLabel>

                      <FormDescription>
                        Aktifkan Meta Pixel pada website.
                      </FormDescription>
                    </div>

                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pixelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pixel ID</FormLabel>

                    <FormControl>
                      <Input placeholder="123456789012345" {...field} />
                    </FormControl>

                    <FormDescription>Masukkan hanya ID Pixel.</FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Microsoft Clarity</CardTitle>

              <CardDescription>
                Session recording, heatmap, dan behavioral analytics menggunakan
                Microsoft Clarity.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="microsoftClarityEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Microsoft Clarity</FormLabel>

                      <FormDescription>
                        Aktifkan Clarity pada website.
                      </FormDescription>
                    </div>

                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="microsoftClarityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project ID</FormLabel>

                    <FormControl>
                      <Input placeholder="abcdefghij" {...field} />
                    </FormControl>

                    <FormDescription>
                      Masukkan Project ID Microsoft Clarity.
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Global Pricing</CardTitle>

              <CardDescription>
                Pengaturan global yang digunakan oleh sistem pricing.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <FormField
                control={form.control}
                name="globalForeignPriceAdjuster"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foreign Price Adjuster</FormLabel>

                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        {...field}
                        value={field.value ?? 0}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>

                    <FormDescription>
                      Nilai adjustment global untuk harga foreign.
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="sticky bottom-4 z-20 flex justify-end rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur">
            <Button
              type="submit"
              disabled={isSaving || !form.formState.isDirty}
              className="min-w-40">
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
    </div>
  );
}
