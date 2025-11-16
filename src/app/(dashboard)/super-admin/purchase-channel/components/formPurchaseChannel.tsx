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

import { ClipboardList, Loader2, Tag, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const purchaseChannelSchema = z.object({
  name: z.string().min(2, {
    message: "Purchase channel name must be at least 2 characters.",
  }),
  isActive: z.boolean(),
});

export type PurchaseChannelFormValues = z.infer<typeof purchaseChannelSchema>;

export default function PurchaseChannelForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: PurchaseChannelFormValues;
  onSubmit: (data: PurchaseChannelFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm<PurchaseChannelFormValues>({
    resolver: zodResolver(purchaseChannelSchema),
    defaultValues: initialData || {
      name: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const handleSubmit = (values: PurchaseChannelFormValues) => {
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
            className="space-y-6 w-full"
          >
            <div className="grid grid-cols-1 gap-6">
              {/* === Name === */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Purchase Channel Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter purchase channel name"
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
                  <FormItem className="flex flex-row items-center gap-3 p-2 border rounded-lg">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormLabel className="flex items-center gap-2 cursor-pointer">
                      <Check className="h-4 w-4 text-muted-foreground" />
                      Active
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* === SUBMIT BUTTON === */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto cursor-pointer"
                variant="default"
                disabled={isLoading || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData
                  ? "Update Purchase Channel"
                  : "Save Purchase Channel"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
