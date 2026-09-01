"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Box, ClipboardList, Loader2, TextQuote } from "lucide-react";

// === SCHEMA ===
const materialTypeSchema = z.object({
  name: z.string().min(2, { message: "Nama material minimal 2 karakter." }),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type MaterialTypeFormValues = z.infer<typeof materialTypeSchema>;

export default function MaterialTypeForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: any;
  onSubmit: (data: MaterialTypeFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm<MaterialTypeFormValues>({
    resolver: zodResolver(materialTypeSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
    }
  }, [initialData, form]);

  return (
    <Card className="w-full relative border-border bg-[oklch(0.98_0.02_90)]">
      {(isLoading || isSubmitting) && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* === Material Name === */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-foreground">
                      <Box className="h-4 w-4 text-primary" />
                      Material Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Kayu Jati, Besi Hollow, dll."
                        {...field}
                        disabled={isLoading || isSubmitting}
                        className="bg-white border-border focus-visible:ring-ring"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Description === */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-foreground">
                      <TextQuote className="h-4 w-4 text-primary" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Berikan keterangan singkat tentang material ini..."
                        className="min-h-30 bg-white border-border focus-visible:ring-ring"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Active Status === */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold">
                        Status Material
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Jika dinonaktifkan, material ini tidak akan ditampilkan di sisi klien (storefront).
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto bg-primary hover:bg-accent text-primary-foreground"
                disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Material" : "Save Material"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
