"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Phone,
  CheckCircle2,
  Loader2,
  ClipboardList,
  Banknote,
  Trash2,
  Link2,
  FileText, // Ikon baru untuk prefix
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// === ZOD SCHEMA (Bank Account) ===
const bankAccountSchema = z.object({
  bankName: z.string().min(2, "Bank name must be at least 2 characters."),
  accountNumber: z.string().min(5, "Account number must be at least 5 digits."),
  accountHolderName: z
    .string()
    .min(2, "Account holder name must be at least 2 characters."),
});

// === ZOD SCHEMA (Sales) ===
const salesSchema = z.object({
  prefix: z
    .string()
    .min(2, { message: "Prefix is required (e.g., Mr., Ms.)." }),
  name: z
    .string()
    .min(2, { message: "Sales name must be at least 2 characters." }),
  phone: z
    .string()
    .min(9, { message: "Phone number too short." })
    .regex(/^(\+?\d{7,15})$/, { message: "Invalid phone number format." }),
  signatureUrl: z.string().optional().nullable(),

  signatureFile: z
    .any()
    .optional()
    .refine(
      (file) =>
        !file ||
        file.length === 0 ||
        (file.length > 0 && file[0].size <= 5000000),
      "Max image size is 5MB."
    )
    .refine(
      (file) =>
        !file ||
        file.length === 0 ||
        (file.length > 0 &&
          ["image/jpeg", "image/png", "image/svg+xml"].includes(file[0].type)),
      "Only .jpg, .png, and .svg formats are supported."
    )
    .or(z.literal("")),
  isActive: z.boolean(),
  bankAccounts: z.array(bankAccountSchema).optional(),
});

export type SalesFormValues = z.infer<typeof salesSchema>;
interface SalesDataFromServer extends SalesFormValues {
  signaturePublicId?: string | null;
}

export default function SalesForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  initialData?: SalesDataFromServer;
  onSubmit: (data: SalesFormValues, file?: File) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          bankAccounts: [],
        }
      : {
          // Mode Create
          prefix: "",
          name: "",
          phone: "",
          signatureUrl: "",
          isActive: true,
          bankAccounts: [],
        },
  });

  // === Hook untuk Dynamic Bank Accounts ===
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bankAccounts",
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  // SalesForm.tsx (Fungsi handleSubmit)

  const handleSubmit = (values: SalesFormValues) => {
    const fileToUpload = values.signatureFile?.[0] as File | undefined;

    const { signatureFile, bankAccounts, ...coreDataToSend } = values;

    let dataToSend: SalesFormValues = coreDataToSend as SalesFormValues;

    if (!initialData) {
      dataToSend = {
        ...dataToSend,
        bankAccounts: bankAccounts,
      };
    } else {
      dataToSend = {
        ...dataToSend,
        bankAccounts: undefined,
      };
    }

    onSubmit(dataToSend, fileToUpload);
  };

  return (
    <Card className="w-full ">
      {isLoading && (
        <div className="absolute inset-0 bg-background/70 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
            encType="multipart/form-data"
          >
            {/* === Bagian Data Inti Sales === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prefix */}
              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Prefix
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      disabled={isLoading || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select prefix (Mr./Ms./...)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mr.">Mr.</SelectItem>
                        <SelectItem value="Ms.">Ms.</SelectItem>
                        <SelectItem value="Mrs.">Mrs.</SelectItem>
                        <SelectItem value="Bpk.">Bpk.</SelectItem>
                        <SelectItem value="Ibu.">Ibu.</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Sales Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Sales Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter sales name"
                        {...field}
                        disabled={isLoading || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+62..."
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
              <FormField
                control={form.control}
                name="signatureFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      Signature Image (PNG/JPG/SVG Max 5MB)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".png, .jpg, .jpeg, .svg"
                        onChange={(event) => {
                          onChange(event.target.files);
                        }}
                        disabled={isLoading || isSubmitting}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormMessage />

                    {/* Tampilkan preview/URL yang sudah ada */}
                    {initialData?.signatureUrl && !value && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Current Signature:
                        </p>
                        <img
                          src={initialData.signatureUrl}
                          alt="Signature Preview"
                          className="w-24 h-auto border rounded-sm object-contain"
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="signatureUrl"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormLabel>Signature URL (Hidden)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!initialData && (
              <div className="md:col-span-2 space-y-4 rounded-lg border p-4">
                <FormLabel className="flex items-center gap-2 text-lg font-semibold">
                  <Banknote className="h-5 w-5 text-muted-foreground" />
                  Bank Accounts (Optional)
                </FormLabel>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 relative bg-muted/50">
                    {/* Tombol Hapus Bank */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => remove(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Bank Name */}
                      <FormField
                        control={form.control}
                        name={`bankAccounts.${index}.bankName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., BCA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Account Number */}
                      <FormField
                        control={form.control}
                        name={`bankAccounts.${index}.accountNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 1234567890"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Account Holder Name */}
                      <FormField
                        control={form.control}
                        name={`bankAccounts.${index}.accountHolderName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Holder Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                ))}

                {/* Tombol Tambah Bank */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    append({
                      bankName: "",
                      accountNumber: "",
                      accountHolderName: "",
                    })
                  }
                  disabled={isSubmitting}
                >
                  + Add Bank Account
                </Button>
              </div>
            )}
            {/* === Tombol Submit === */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4 mr-2" />
                )}
                {initialData ? "Update Sales" : "Save Sales"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
