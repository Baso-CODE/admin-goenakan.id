"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Resolver, useForm } from "react-hook-form";
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
import { ClipboardList, Loader2, Tag as TagIcon } from "lucide-react";

const articleTagSchema = z.object({
  name: z.string().min(2, { message: "Nama tag minimal 2 karakter." }),
});

export type ArticleTagFormValues = z.infer<typeof articleTagSchema>;

export default function ArticleTagForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: ArticleTagFormValues;
  onSubmit: (data: ArticleTagFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm<ArticleTagFormValues>({
    resolver: zodResolver(articleTagSchema) as Resolver<ArticleTagFormValues>,
    defaultValues: initialData || {
      name: "",
    },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const handleSubmit = (values: ArticleTagFormValues) => {
    onSubmit(values);
  };

  return (
    <Card className="w-full relative">
      {(isLoading || isSubmitting) && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 w-full">
            <div className="grid grid-cols-1 gap-6">
              {/* === Tag Name === */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <TagIcon className="h-4 w-4 text-muted-foreground" />
                      Tag Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Wedding, Tips Bisnis, Edukasi..."
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
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto cursor-pointer bg-[#C4A48E] hover:bg-[#a38975]"
                variant={"default"}
                disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Tag" : "Save Tag"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
