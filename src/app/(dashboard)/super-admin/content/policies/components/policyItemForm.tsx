"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useApi } from "@/hooks/useApi";
import {
  Check,
  ClipboardList,
  FileText,
  Languages,
  Layers,
  ListOrdered,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

// Import Komponen Form Kategori yang sudah Anda buat
import PolicyCategoryForm, {
  PolicyCategoryFormValues,
} from "./policyCategoryForm";

// === SCHEMA BILINGUAL POLICY ===
const policyItemSchema = z.object({
  titleId: z
    .string()
    .min(3, { message: "Title (ID) must be at least 3 characters." }),
  titleEn: z
    .string()
    .min(3, { message: "Title (EN) must be at least 3 characters." }),
  contentId: z
    .string()
    .min(10, { message: "Content (ID) must be at least 10 characters." }),
  contentEn: z
    .string()
    .min(10, { message: "Content (EN) must be at least 10 characters." }),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  displayOrder: z.number().min(0, "Order must be 0 or greater").default(0),
  isActive: z.boolean().default(true),
});

export type PolicyItemFormValues = z.infer<typeof policyItemSchema>;

export default function PolicyForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: PolicyItemFormValues;
  onSubmit: (data: PolicyItemFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const { fetchApi, status } = useApi();
  const [categories, setCategories] = useState<
    { id: number; nameId: string; nameEn: string }[]
  >([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // Modal State for Quick Add Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // 1. Fetch Categories Function
  const fetchCategories = async () => {
    if (status !== "authenticated") return;

    setLoadingCats(true);
    try {
      const res = await fetchApi("/content/policies/categories");
      if (!res.ok) throw new Error("Failed to load categories");

      const data = await res.json();
      setCategories(data.data || data);
    } catch (error) {
      console.error("❌ Failed to load Policy categories:", error);
      toast.error("Failed to load category options");
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [status, fetchApi]);

  // 2. Main Form Initialization
  const form = useForm({
    resolver: zodResolver(policyItemSchema),
    defaultValues: initialData ?? {
      titleId: "",
      titleEn: "",
      contentId: "",
      contentEn: "",
      categoryId: "",
      displayOrder: 0,
      isActive: true,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        titleId: initialData.titleId,
        titleEn: initialData.titleEn,
        contentId: initialData.contentId,
        contentEn: initialData.contentEn,
        categoryId: initialData.categoryId.toString(),
        displayOrder: initialData.displayOrder,
        isActive: initialData.isActive,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: z.infer<typeof policyItemSchema>) => {
    onSubmit(values as PolicyItemFormValues);
  };

  // 4. Handle Quick Add Category Submission via the full component
  const handleCreateCategory = async (data: PolicyCategoryFormValues) => {
    if (status !== "authenticated") return;

    setIsAddingCategory(true);
    try {
      const res = await fetchApi("/content/policies/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create Policy category");
      }

      // Refetch categories to update the dropdown list
      await fetchCategories();

      toast.success("Policy Category created successfully!");
      setIsCategoryModalOpen(false); // Tutup modal setelah berhasil
    } catch (err) {
      console.error("❌ Failed to create Policy category:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create category",
      );
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <Card className="w-full relative">
      {(isLoading || loadingCats) && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* === Title ID === */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  control={form.control}
                  name="titleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        Title (Bahasa Indonesia) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Kebijakan Privasi"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Title EN === */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  control={form.control}
                  name="titleEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        Title (English) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Privacy Policy"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Content ID === */}
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="contentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Content (Bahasa Indonesia) *
                      </FormLabel>
                      <FormControl>
                        <div
                          className={`w-full max-w-full overflow-hidden border rounded-xl bg-white shadow-sm ${isLoading || isSubmitting ? "opacity-50 pointer-events-none" : ""}`}>
                          <SimpleEditor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            minHeight="250px"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Content EN === */}
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="contentEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Content (English) *
                      </FormLabel>
                      <FormControl>
                        <div
                          className={`w-full max-w-full overflow-hidden border rounded-xl bg-white shadow-sm ${isLoading || isSubmitting ? "opacity-50 pointer-events-none" : ""}`}>
                          <SimpleEditor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            minHeight="250px"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Category Selection with Quick Add Modal === */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        Category *
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        <Select
                          disabled={isLoading || isSubmitting || loadingCats}
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue
                                placeholder={
                                  loadingCats
                                    ? "Loading categories..."
                                    : "Select a category"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem
                                key={cat.id}
                                value={cat.id.toString()}>
                                {cat.nameId} / {cat.nameEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Quick Add Dialog / Modal */}
                        <Dialog
                          open={isCategoryModalOpen}
                          onOpenChange={setIsCategoryModalOpen}>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="shrink-0"
                              title="Add New Category">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="uppercase tracking-tight">
                                Quick Add Category
                              </DialogTitle>
                            </DialogHeader>
                            <div className="pt-4">
                              <PolicyCategoryForm
                                onSubmit={handleCreateCategory}
                                isSubmitting={isAddingCategory}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Display Order === */}
              <div className="col-span-2 md:col-span-1">
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ListOrdered className="h-4 w-4 text-muted-foreground" />
                        Display Order
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          disabled={isLoading || isSubmitting}
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Active Status === */}
              <div className="col-span-2 flex items-center">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg w-full md:w-1/2 h-12.5">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2 cursor-pointer m-0">
                          <Check className="h-4 w-4 text-muted-foreground" />
                          Active Status
                        </FormLabel>
                        <FormDescription className="text-[10px]">
                          Visible to users.
                        </FormDescription>
                      </div>
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
                disabled={isLoading || isSubmitting || loadingCats}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Policy" : "Save Policy"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
