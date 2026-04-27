"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/useApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// === SKEMA HANYA UNTUK BANK ACCOUNTS ===
const bankAccountSchema = z.object({
  bankName: z.string().min(2, "Bank name must be at least 2 characters."),
  accountNumber: z
    .string()
    .min(5, "Account number must be at least 5 digits.")
    .refine((val) => {
      return true;
    }, "Account number must be unique"),
  accountHolderName: z
    .string()
    .min(2, "Account holder name must be at least 2 characters."),
});

const salesBankSchema = z.object({
  bankAccounts: z.array(bankAccountSchema),
});

type SalesBankFormValues = z.infer<typeof salesBankSchema>;

// Tipe data untuk prop
interface BankAccount {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

interface SalesBankFormProps {
  salesId: string;
  initialBankAccounts: BankAccount[];
  onUpdateSuccess: () => void;
}

export default function SalesBankForm({
  salesId,
  initialBankAccounts,
  onUpdateSuccess,
}: SalesBankFormProps) {
  const { fetchApi, status } = useApi();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SalesBankFormValues>({
    resolver: zodResolver(salesBankSchema),
    defaultValues: {
      bankAccounts: initialBankAccounts,
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({ bankAccounts: initialBankAccounts });
  }, [initialBankAccounts, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bankAccounts",
  });

  const handleUpdate = async (values: SalesBankFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const payload = values.bankAccounts.map(
        ({ bankName, accountNumber, accountHolderName }) => ({
          bankName,
          accountNumber,
          accountHolderName,
        }),
      );

      const res = await fetchApi(`/sales/${salesId}/banks`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.message || "Failed to update bank accounts");
      }

      toast.success("Bank Accounts updated successfully!");
      onUpdateSuccess();
    } catch (err: any) {
      console.error("❌ Update Sales Banks Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update bank accounts",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" /> Kelola Bank Accounts
          </h3>
          <p className="text-sm text-muted-foreground">
            Semua perubahan di sini akan **mengganti** daftar akun bank yang
            sudah ada.
          </p>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 relative bg-card shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => remove(index)}
                  disabled={isSubmitting}>
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
                        <Input placeholder="e.g., BCA" {...field} />
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
                        <Input placeholder="e.g., 1234567890" {...field} />
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
                        <Input placeholder="e.g., John Doe" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  bankName: "",
                  accountNumber: "",
                  accountHolderName: "",
                })
              }
              disabled={isSubmitting}>
              + Add Bank Account
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Save Bank Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
