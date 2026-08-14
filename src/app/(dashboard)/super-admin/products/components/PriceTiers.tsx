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
import { ArrowRight, Layers, PlusCircle, Trash2, Info } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

export function PriceTiers() {
  const { control, watch } = useFormContext(); // Ambil context dari form parent
  const { fields } = useFieldArray({
    control,
    name: "priceTiers",
  });

  const basePrice = Number(watch("basePrice") ?? 0);
  const priceTiersWatch = useWatch({
    control,
    name: "priceTiers",
  });

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-stone-850">
            <Layers className="h-5 w-5 text-indigo-500" />
            Harga Bertingkat (Wholesale)
          </CardTitle>
          <CardDescription>
            Harga dasar produk: <strong>Rp {basePrice.toLocaleString("id-ID")}</strong>.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {/* Callout Information Banner */}
        <div className="mb-6 p-4 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-start gap-3 shadow-xs">
          <Info className="h-5 w-5 shrink-0 mt-0.5 text-indigo-650" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm">Informasi Master Pricing</p>
            <p className="leading-relaxed">
              Pengaturan harga bertingkat (wholesale price tiers) kini terintegrasi satu arah. Silakan kelola nominal harga, diskon tier, dan kalkulasi cogs produk melalui menu <strong>Kelola Master Pricing</strong> di halaman utama daftar produk.
            </p>
          </div>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-10 bg-stone-50 rounded-lg border border-dashed border-stone-250">
            <p className="text-sm text-stone-500">
              Belum ada data tier harga. Silakan atur nominal harga bertingkat melalui menu <strong>Kelola Master Pricing</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tampilan Desktop: Table Style */}
            <div className="hidden md:block rounded-md border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50 hover:bg-stone-50">
                    <TableHead className="w-36 font-semibold">Min Qty</TableHead>
                    <TableHead className="w-6"></TableHead>
                    <TableHead className="w-36 font-semibold">Max Qty</TableHead>
                    <TableHead className="w-48 font-semibold">Diskon Satuan (Rp)</TableHead>
                    <TableHead className="font-semibold">Harga Akhir Satuan (Rp)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const discountVal = Number(priceTiersWatch?.[index]?.discount ?? 0);
                    const finalPrice = Math.max(0, basePrice - discountVal);

                    return (
                      <TableRow key={field.id} className="hover:bg-transparent">
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
                                    disabled
                                    className="bg-stone-50 text-stone-500 border-stone-200 cursor-not-allowed"
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
                                      disabled
                                      className="bg-stone-50 text-stone-500 border-stone-200 cursor-not-allowed"
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
                                      className="pl-9 bg-stone-50 text-stone-500 border-stone-200 cursor-not-allowed"
                                      placeholder="0"
                                      disabled
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
                          <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            Rp {finalPrice.toLocaleString("id-ID")}
                          </div>
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
                                disabled
                                className="bg-stone-50 text-stone-500 border-stone-200 cursor-not-allowed"
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
                                disabled
                                className="bg-stone-50 text-stone-500 border-stone-200 cursor-not-allowed"
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

                    <FormField
                      control={control}
                      name={`priceTiers.${index}.discount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Diskon Satuan</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                                Rp
                              </span>
                              <Input
                                type="number"
                                className="pl-9 bg-stone-50 text-stone-500 border-stone-200 cursor-not-allowed"
                                placeholder="0"
                                disabled
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

                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Harga Akhir:</span>
                      <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        Rp {finalPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
