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
import * as LucideIcons from "lucide-react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, ClipboardList, Link2, Loader2, Tag } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const contactPlatformSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Platform name must be at least 2 characters." }),
  slug: z.string().min(1, { message: "Slug is required." }),
  icon: z.string().optional(),

  isActive: z.boolean(),
});

const iconNames = Object.keys(LucideIcons).slice(0, 50);

export type ContactPlatformFormValues = z.infer<typeof contactPlatformSchema>;

export default function ContactPlatformForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: ContactPlatformFormValues;
  onSubmit: (data: ContactPlatformFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm<ContactPlatformFormValues>({
    resolver: zodResolver(contactPlatformSchema),
    defaultValues: initialData || {
      name: "",
      slug: "",
      icon: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const handleSubmit = (values: ContactPlatformFormValues) => {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Platform Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter platform name"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slug */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      Slug
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter unique slug (e.g. whatsapp, email)"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
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

              {/* === ICON PICKER === */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => {
                  const platformIcons = [
                    "Instagram",
                    "Facebook",
                    "Mail",
                    "Phone",
                    "Send",
                    "MessageCircle",
                    "MessageSquare",
                    "Linkedin",
                    "Twitter",
                    "Globe2",
                    "Music",
                    "AtSign",
                    "Link",
                    "Youtube",
                    "Signal",
                    "Slack",
                    "Discord",
                    "Globe",
                  ];
                  const IconPreview =
                    (LucideIcons as any)[field.value] || LucideIcons.HelpCircle;

                  return (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        Icon
                      </FormLabel>

                      <Command className="border rounded-md">
                        <CommandInput
                          placeholder="Search icon..."
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                        <CommandList>
                          <CommandEmpty>No icons found.</CommandEmpty>
                          <CommandGroup heading="Communication Icons">
                            {platformIcons.map((icon) => {
                              const Icon = (LucideIcons as any)[icon];
                              if (!Icon) return null;

                              return (
                                <CommandItem
                                  key={icon}
                                  value={icon}
                                  onSelect={() => field.onChange(icon)}
                                  className="flex items-center gap-2"
                                >
                                  <Icon className="h-4 w-4" />
                                  <span>{icon}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>

                      {/* === ICON PREVIEW === */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-10 h-10 flex items-center justify-center border rounded-md bg-muted/50">
                          <IconPreview className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {field.value || "No icon selected"}
                        </span>
                      </div>

                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto cursor-pointer"
                disabled={isLoading || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Platform" : "Save Platform"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
