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
import { ArrowRight, Layers, PlusCircle, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

export function PriceTiers() {
  const { control, register } = useFormContext(); // Ambil context dari form parent
  const { fields, append, remove } = useFieldArray({
    control,
    name: "priceTiers",
  });

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Harga Bertingkat (Wholesale)
            </CardTitle>
            <CardDescription>
              Atur harga diskon berdasarkan jumlah pembelian (Min - Max Qty).
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ minQuantity: 1, maxQuantity: null, price: 0 })
            }
            className="border-dashed">
            <PlusCircle className="h-4 w-4 mr-2" />
            Tambah Tier
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Belum ada tier harga. Klik "Tambah Tier" untuk memulai.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tampilan Desktop: Table Style */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-45">Min Qty</TableHead>
                    <TableHead className="w-[30px]"></TableHead>
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
                                    // Handle string to number conversion if needed by your schema
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
                        <FormLabel className="text-xs">Harga Satuan</FormLabel>
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
      </CardContent>
    </Card>
  );
}
