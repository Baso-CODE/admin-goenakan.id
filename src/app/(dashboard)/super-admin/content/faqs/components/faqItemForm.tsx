"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
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
  Languages,
  Loader2,
  Plus,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import FaqCategoryForm from "../categories/component/formFaqCategories";

// === SCHEMA (BILINGUAL) ===
const faqItemSchema = z.object({
  questionId: z.string().min(5, "Question (ID) must be at least 5 chars."),
  questionEn: z.string().min(5, "Question (EN) must be at least 5 chars."),
  answerId: z.string().min(10, "Answer (ID) must be at least 10 chars."),
  answerEn: z.string().min(10, "Answer (EN) must be at least 10 chars."),
  categoryId: z.string().min(1, "Please select a category."),
  displayOrder: z.number().min(0, "Order must be 0 or greater").default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type FaqItemFormValues = z.infer<typeof faqItemSchema>;

export default function FaqItemForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: FaqItemFormValues;
  onSubmit: (data: FaqItemFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const { fetchApi, status } = useApi();
  const [categories, setCategories] = useState<
    { id: string; nameId: string; nameEn: string }[]
  >([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  useEffect(() => {
    const fetchCategories = async () => {
      if (status !== "authenticated") return;
      setLoadingCats(true);
      try {
        const res = await fetchApi("/content/faqs/categories/list");
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        toast.error("Failed to load category options");
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, [status, fetchApi]);

  const form = useForm<FaqItemFormValues>({
    resolver: zodResolver(faqItemSchema) as Resolver<FaqItemFormValues>,
    defaultValues: initialData ?? {
      questionId: "",
      questionEn: "",
      answerId: "",
      answerEn: "",
      categoryId: "",
      displayOrder: 0,
      isFeatured: false,
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const fetchCategories = async () => {
    if (status !== "authenticated") return;
    setLoadingCats(true);
    try {
      const res = await fetchApi("/content/faqs/categories/list");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load category options");
    } finally {
      setLoadingCats(false);
    }
  };

  // 2. Panggil di useEffect
  useEffect(() => {
    fetchCategories();
  }, [status, fetchApi]);
  return (
    <Card className="w-full relative">
      {/* LOADING OVERLAY */}
      {(isLoading || loadingCats) && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* === SECTION INDONESIA === */}
            <div className="space-y-4 border p-4 rounded-lg bg-stone-50/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Languages className="w-4 h-4" /> Bahasa Indonesia
              </h3>
              <FormField
                control={form.control}
                name="questionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pertanyaan (ID) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="answerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jawaban (ID) *</FormLabel>
                    <FormControl>
                      <div
                        className={`border rounded-xl bg-white ${isSubmitting ? "opacity-50" : ""}`}>
                        <SimpleEditor
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          minHeight="250px"
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* === SECTION ENGLISH === */}
            <div className="space-y-4 border p-4 rounded-lg bg-stone-50/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Languages className="w-4 h-4" /> English
              </h3>
              <FormField
                control={form.control}
                name="questionEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question (EN) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="answerEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer (EN) *</FormLabel>
                    <FormControl>
                      <div
                        className={`border rounded-xl bg-white ${isSubmitting ? "opacity-50" : ""}`}>
                        <SimpleEditor
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          minHeight="250px"
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* === METADATA === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <div className="flex items-center gap-2">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting || loadingCats}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingCats ? "Loading..." : "Select category"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nameId} / {cat.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* --- DIALOG QUICK ADD --- */}
                      <Dialog
                        open={isCategoryModalOpen}
                        onOpenChange={setIsCategoryModalOpen}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Add New FAQ Category</DialogTitle>
                          </DialogHeader>
                          <FaqCategoryForm
                            onSubmit={async (data) => {
                              const res = await fetchApi(
                                "/content/faqs/categories",
                                {
                                  method: "POST",
                                  body: JSON.stringify(data),
                                },
                              );

                              if (res.ok) {
                                toast.success("Category created!");
                                setIsCategoryModalOpen(false);

                                await fetchCategories();
                              } else {
                                const err = await res.json().catch(() => ({}));
                                toast.error(
                                  err.message || "Failed to create category",
                                );
                              }
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} disabled={isSubmitting} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 p-3 border rounded-lg">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormLabel className="flex items-center gap-2 m-0">
                      <Star className="w-4 h-4 text-yellow-500" /> Featured
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 p-3 border rounded-lg">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormLabel className="flex items-center gap-2 m-0">
                      <Check className="w-4 h-4" /> Active
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <ClipboardList className="mr-2" />
              )}
              {initialData ? "Update" : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
