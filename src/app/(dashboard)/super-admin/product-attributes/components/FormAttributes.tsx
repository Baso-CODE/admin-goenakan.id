"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { ListPlus, Loader2, Tag, Trash2 } from "lucide-react";

// ===================== Schema ===================== //

const valueSchema = z.object({
  id: z.string().optional(),
  value: z.string().min(1, "Value is required"),
  deleted: z.boolean().optional(),
});

export const attributeSchema = z.object({
  name: z.string().min(2, "Attribute name must be at least 2 characters"),
  values: z.array(valueSchema).min(1, "At least one value is required"),
});

export type AttributeFormValues = z.infer<typeof attributeSchema>;

// ===================== Component ===================== //

export default function AttributeForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: AttributeFormValues;
  onSubmit: (data: AttributeFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema),
    defaultValues: initialData || {
      name: "",
      values: [{ value: "" }],
    },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const { control } = form;

  const { fields, append, remove } = useFieldArray({
    name: "values",
    control,
  });

  const handleSubmit = (values: AttributeFormValues) => {
    onSubmit(values);
  };

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
            className="space-y-6 w-full">
            {/* ===================== Attribute Name ===================== */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    Attribute Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Input attribute name (e.g., Color)"
                      {...field}
                      disabled={isLoading || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ===================== VALUES ===================== */}

            <div className="space-y-4">
              <FormLabel>Attribute Values</FormLabel>

              {fields.map((field, index) => {
                const item = form.watch(`values.${index}`);

                if (item?.deleted) return null;

                return (
                  <div key={field.id} className="flex items-center gap-3">
                    <FormField
                      control={form.control}
                      name={`values.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="destructive"
                      className="p-2"
                      onClick={() => {
                        const current = form.getValues("values");

                        if (current[index].id) {
                          form.setValue(`values.${index}.deleted`, true);
                        } else {
                          remove(index);
                        }
                      }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => append({ value: "" })}
                disabled={isLoading || isSubmitting}>
                <ListPlus className="h-4 w-4" /> Add Value
              </Button>
            </div>

            {/* ===================== Submit Button ===================== */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4 mr-2" />
                )}

                {initialData ? "Update Attribute" : "Save Attribute"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
