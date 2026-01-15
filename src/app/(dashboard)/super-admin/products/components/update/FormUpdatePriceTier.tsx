"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Layers, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

// Schema validasi untuk Price Tier
const priceTierSchema = z.object({
  minQuantity: z.number().min(1, "Min qty wajib diisi"),
  maxQuantity: z.number().min(1).nullable().optional(),
  price: z.number().min(0, "Harga tidak boleh negatif"),
});

const formSchema = z.object({
  priceTiers: z.array(priceTierSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface FormUpdatePriceTiersProps {
  initialData: any; // Data produk lengkap dari API
  isSubmitting: boolean;
  onSubmit: (data: any[]) => Promise<void>; // Handler update ke API
}

export default function FormUpdatePriceTiers({
  initialData,
  isSubmitting,
  onSubmit,
}: FormUpdatePriceTiersProps) {
  // Inisialisasi Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priceTiers: [],
    },
  });

  const { control, handleSubmit, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "priceTiers",
  });

  // Load initial data saat komponen mount atau data berubah
  useEffect(() => {
    if (initialData?.priceTiers) {
      // Mapping data dari API (mungkin string) ke format form (number)
      const formattedTiers = initialData.priceTiers.map((tier: any) => ({
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity ?? null,
        price: Number(tier.price), // Pastikan jadi number
      }));
      reset({ priceTiers: formattedTiers });
    }
  }, [initialData, reset]);

  // Handler saat form disubmit
  const onSave = async (values: FormValues) => {
    await onSubmit(values.priceTiers);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Harga Bertingkat (Wholesale)
            </CardTitle>
            <CardDescription>
              Atur harga diskon berdasarkan jumlah pembelian.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ minQuantity: 1, maxQuantity: null, price: 0 })
              }
              className="border-dashed h-8">
              <PlusCircle className="h-3.5 w-3.5 mr-2" />
              Tambah Tier
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSave)} className="space-y-6">
            {fields.length === 0 ? (
              <div className="text-center py-10 bg-muted/30 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Belum ada tier harga. Klik "Tambah Tier" untuk memulai.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tampilan Desktop: Table Style */}
                <div className="hidden md:block rounded-md border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-45">Min Qty</TableHead>
                        <TableHead className="w-7.5"></TableHead>
                        <TableHead className="w-45">Max Qty</TableHead>
                        <TableHead>Harga Satuan (Rp)</TableHead>
                        <TableHead className="w-12.5"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={control}
                              name={`priceTiers.${index}.minQuantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      placeholder="1"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(e.target.valueAsNumber)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={control}
                              name={`priceTiers.${index}.maxQuantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        min={1}
                                        placeholder="∞"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          field.onChange(
                                            val === "" ? null : parseInt(val)
                                          );
                                        }}
                                      />
                                      {!field.value && (
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none">
                                          Unlimited
                                        </span>
                                      )}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={control}
                              name={`priceTiers.${index}.price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                                        Rp
                                      </span>
                                      <Input
                                        type="number"
                                        className="pl-9"
                                        placeholder="0"
                                        {...field}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => remove(index)}
                              className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Tampilan Mobile: Card Stack */}
                <div className="md:hidden space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="bg-card border rounded-lg p-4 space-y-3 relative shadow-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="grid grid-cols-2 gap-3 items-end">
                        <FormField
                          control={control}
                          name={`priceTiers.${index}.minQuantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Min Qty</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.valueAsNumber)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name={`priceTiers.${index}.maxQuantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Max Qty</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Max (∞)"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                      val === "" ? null : parseInt(val)
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={control}
                        name={`priceTiers.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Harga Satuan
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                                  Rp
                                </span>
                                <Input
                                  type="number"
                                  className="pl-9"
                                  placeholder="Harga"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan Perubahan Harga
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
