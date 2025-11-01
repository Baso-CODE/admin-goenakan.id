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
import { Switch } from "@/components/ui/switch";
import {
  AlignLeft,
  CheckCircle2,
  ClipboardList,
  Layers,
  Loader2,
  Tag,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const vendorCategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Category name must be at least 2 characters." }),
  type: z.string().min(1, { message: "Please select a category type." }),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export type VendorCategoryFormValues = z.infer<typeof vendorCategorySchema>;

export default function VendorCategoryForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: VendorCategoryFormValues;
  onSubmit: (data: VendorCategoryFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm<VendorCategoryFormValues>({
    resolver: zodResolver(vendorCategorySchema),
    defaultValues: initialData || {
      name: "",
      type: "",
      description: "",
      isActive: true,
    },
  });
  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const handleSubmit = (values: VendorCategoryFormValues) => {
    onSubmit(values);
  };

  const categoryTypes = [
    { id: "SERVICE", name: "Service" },
    { id: "PRODUCT", name: "Product" },
  ];

  return (
    <Card className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Category Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter category name"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      Type
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryTypes.map((cat) => (
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
              {/* Active Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      Active Status
                    </FormLabel>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSubmitting}
                      />
                      <span className="text-sm text-muted-foreground">
                        {field.value ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4 text-muted-foreground" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter description..."
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* === SUBMIT BUTTON === */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto cursor-pointer"
                variant={"default"}
                disabled={isLoading || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Category" : "Save Category"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
