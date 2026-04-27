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
  HelpCircle,
  Layers,
  ListOrdered,
  Loader2,
  Star,
} from "lucide-react";
import { toast } from "sonner";

// === SCHEMA ===
const faqItemSchema = z.object({
  question: z.string().min(5, {
    message: "Question must be at least 5 characters.",
  }),
  answer: z.string().min(10, {
    message: "Answer must be at least 10 characters.",
  }),
  categoryId: z.string().min(1, {
    message: "Please select a category.",
  }),

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
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [loadingCats, setLoadingCats] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      if (status !== "authenticated") return;

      setLoadingCats(true);
      try {
        const res = await fetchApi("/content/faqs/categories/list");

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to load categories");
        }

        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("❌ Failed to load FAQ categories:", error);
        toast.error("Failed to load category options");
      } finally {
        setLoadingCats(false);
      }
    };

    fetchCategories();
  }, [status, fetchApi]);

  // 2. Form Initialization
  const form = useForm({
    resolver: zodResolver(faqItemSchema),
    defaultValues: initialData ?? {
      question: "",
      answer: "",
      categoryId: "",
      displayOrder: 0,
      isFeatured: false,
      isActive: true,
    },
    mode: "onBlur",
  });

  // 3. Reset form when initialData loads (Edit Mode)
  useEffect(() => {
    if (initialData) {
      form.reset({
        question: initialData.question,
        answer: initialData.answer,
        categoryId: initialData.categoryId,
        displayOrder: initialData.displayOrder,
        isFeatured: initialData.isFeatured,
        isActive: initialData.isActive,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: z.infer<typeof faqItemSchema>) => {
    onSubmit(values as FaqItemFormValues);
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
              {/* === Question === */}
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        Question *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. How do I track my order?"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Answer (MENGGUNAKAN TIPTAP EDITOR) === */}
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Answer *
                      </FormLabel>
                      <FormControl>
                        <div
                          className={`w-full max-w-full overflow-hidden border rounded-xl bg-white shadow-sm ${isLoading || isSubmitting ? "opacity-50 pointer-events-none" : ""}`}>
                          <SimpleEditor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === Category Selection === */}
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
                      <Select
                        disabled={isLoading || isSubmitting || loadingCats}
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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

              {/* === Featured Status === */}
              <div className="col-span-2 md:col-span-1 flex items-center">
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg w-full h-12.5">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2 cursor-pointer m-0">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          Featured FAQ
                        </FormLabel>
                        <FormDescription className="text-[10px]">
                          Show on home/landing page.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* === Active Status === */}
              <div className="col-span-2 md:col-span-1 flex items-center">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 p-3 border rounded-lg w-full h-12.5">
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
                {initialData ? "Update FAQ Item" : "Save FAQ Item"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
