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
import { Resolver, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

// Schema validasi untuk Price Tier
const priceTierSchema = z.object({
  minQuantity: z.coerce.number().min(1, "Min qty wajib diisi"),
  maxQuantity: z.coerce.number().min(1).nullable().optional(),
  discount: z.coerce.number().min(0, "Diskon tidak boleh negatif"),
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
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      priceTiers: [],
    },
  });

  const { control, handleSubmit, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "priceTiers",
  });

  // Watch values untuk hitung harga secara real-time
  const priceTiersWatch = useWatch({
    control,
    name: "priceTiers",
  });

  const basePrice = Number(initialData?.basePrice ?? 0);

  // Load initial data saat komponen mount atau data berubah
  useEffect(() => {
    if (initialData) {
      const basePriceVal = Number(initialData.basePrice ?? 0);
      const formattedTiers = (initialData.priceTiers || []).map((tier: any) => {
        const priceVal = Number(tier.price || 0);
        // diskon = basePrice - price
        const discountVal = Math.max(0, basePriceVal - priceVal);
        return {
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity ?? null,
          discount: discountVal,
        };
      });
      reset({ priceTiers: formattedTiers });
    }
  }, [initialData, reset]);

  // Handler saat form disubmit
  const onSave = async (values: FormValues) => {
    let basePriceVal = Number(initialData?.basePrice);
    if (isNaN(basePriceVal)) {
      basePriceVal = 0;
    }

    const mappedTiers = values.priceTiers.map((tier) => {
      const discountVal = Number(tier.discount || 0);
      const calculatedPrice = Math.max(0, basePriceVal - discountVal);

      return {
        minQuantity: Number(tier.minQuantity || 1),
        maxQuantity: tier.maxQuantity ? Number(tier.maxQuantity) : null,
        price: isNaN(calculatedPrice) ? 0 : calculatedPrice,
      };
    });

    await onSubmit(mappedTiers);
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
              Atur nominal diskon berdasarkan jumlah pembelian. Harga dasar produk: <strong>Rp {basePrice.toLocaleString("id-ID")}</strong>.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ minQuantity: 1, maxQuantity: null, discount: 0 })
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
                        <TableHead className="w-36">Min Qty</TableHead>
                        <TableHead className="w-6"></TableHead>
                        <TableHead className="w-36">Max Qty</TableHead>
                        <TableHead className="w-48">Diskon Satuan (Rp)</TableHead>
                        <TableHead>Harga Akhir Satuan (Rp)</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                        const discountVal = Number(priceTiersWatch?.[index]?.discount ?? 0);
                        const finalPrice = Math.max(0, basePrice - discountVal);

                        return (
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
                                              val === "" ? null : parseInt(val),
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
                                name={`priceTiers.${index}.discount`}
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
                                          onChange={(e) =>
                                            field.onChange(parseFloat(e.target.value) || 0)
                                          }
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="text-sm font-semibold text-stone-905">
                                Rp {finalPrice.toLocaleString("id-ID")}
                              </div>
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Tampilan Mobile: Card Stack */}
                <div className="md:hidden space-y-3">
                  {fields.map((field, index) => {
                    const discountVal = Number(priceTiersWatch?.[index]?.discount ?? 0);
                    const finalPrice = Math.max(0, basePrice - discountVal);

                    return (
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
                                        val === "" ? null : parseInt(val),
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 items-end">
                          <FormField
                            control={control}
                            name={`priceTiers.${index}.discount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Diskon Satuan
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2 text-xs text-muted-foreground">
                                      Rp
                                    </span>
                                    <Input
                                      type="number"
                                      className="pl-8 h-8 text-xs"
                                      placeholder="0"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormItem>
                            <FormLabel className="text-xs">Harga Akhir</FormLabel>
                            <div className="h-8 flex items-center text-xs font-semibold text-stone-905 bg-stone-50 border rounded px-3">
                              Rp {finalPrice.toLocaleString("id-ID")}
                            </div>
                          </FormItem>
                        </div>
                      </div>
                    );
                  })}
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
