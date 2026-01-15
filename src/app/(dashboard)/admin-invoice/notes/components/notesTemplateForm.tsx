"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";

import {
  Check,
  ClipboardList,
  FileText,
  Layers,
  Loader2,
  Tag,
} from "lucide-react";

// === PERBAIKAN 1: SCHEMA ===
// Hapus .default(true) agar tipe datanya menjadi strict boolean
const noteTemplateSchema = z.object({
  categoryId: z.string().min(1, { message: "Please select a category." }),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  content: z
    .string()
    .min(10, { message: "Content is too short (min 10 chars)." }),
  isActive: z.boolean(),
});

export type NoteTemplateFormValues = z.infer<typeof noteTemplateSchema>;

// Tipe data untuk dropdown kategori
type CategoryOption = {
  id: string;
  name: string;
};

export default function NoteTemplateForm({
  initialData,
  categories,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  // Gunakan Partial agar aman jika data dari server tidak lengkap
  initialData?: Partial<NoteTemplateFormValues>;
  categories: CategoryOption[];
  onSubmit: (data: NoteTemplateFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  // === PERBAIKAN 2: DEFAULT VALUES ===
  // Handle default value di sini (level React Hook Form)
  const form = useForm<NoteTemplateFormValues>({
    resolver: zodResolver(noteTemplateSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || "",
      title: initialData?.title || "",
      content: initialData?.content || "",
      // Jika initialData.isActive undefined, gunakan true sebagai default
      isActive: initialData?.isActive ?? true,
    },
  });

  // === PERBAIKAN 3: RESET ===
  // Pastikan saat reset juga mengikuti logika yang sama
  useEffect(() => {
    if (initialData) {
      form.reset({
        categoryId: initialData.categoryId || "",
        title: initialData.title || "",
        content: initialData.content || "",
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: NoteTemplateFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className="w-full relative shadow-sm border-t-4 border-t-purple-600">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* === Category Dropdown === */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      Select Category
                    </FormLabel>
                    <Select
                      disabled={isLoading || isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a category..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Title === */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Template Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. BCA Transfer, Fragile Goods"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === Content (Textarea) === */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Note Content
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write the full note content here..."
                        className="min-h-30"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* === isActive === */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg bg-gray-50/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-0.5 cursor-pointer">
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        Active Status
                      </FormLabel>
                      <p className="text-[11px] text-muted-foreground">
                        Template will be available for selection in invoices.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* === Submit Button === */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Template" : "Save Template"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
