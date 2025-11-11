"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { OrderFormValues, orderSchema } from "./order-schema";
import { fetchWithToken, postOrder } from "./order-service";

type Client = { id: string; name: string; phone: string; address: string };
type Sales = { id: string; name: string; phone: string };
type Vendor = { id: string; companyName: string };
type Product = { id: string; name: string; basePrice: number };

export default function OrderForm() {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      dateOrder: "",
      salesCategory: "SALES",
      poNumber: "",
      clientId: "",
      shippingAddress: "",
      salesId: "",
      vendorIds: [],
      products: [
        {
          productId: "",
          quantity: 1,
          price: 0,
          customization: "",
          remarks: "",
        },
      ],
    },
  });

  const { control, handleSubmit, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  const [clients, setClients] = useState<Client[]>([]);
  console.log(clients);

  const [sales, setSales] = useState<Sales[]>([]);
  console.log(sales);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  console.log(vendors);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [c, s, v, p] = await Promise.all([
          fetchWithToken("http://localhost:8000/clients/order"),
          fetchWithToken("http://localhost:8000/sales/order"),
          fetchWithToken("http://localhost:8000/vendors/order/add"),
          fetchWithToken("http://localhost:8000/products/order"),
        ]);
        setClients(c);
        setSales(s);
        setVendors(v);
        setProducts(p);
      } catch {
        toast.error("Failed to load master data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const clientId = watch("clientId");
  useEffect(() => {
    const client = clients.find((c) => c.id === clientId);
    if (client) setValue("shippingAddress", client.address);
  }, [clientId, clients, setValue]);

  const onSubmit = async (data: OrderFormValues) => {
    try {
      setLoading(true);
      await postOrder(data);
      toast.success("Order created successfully");
      form.reset();
    } catch {
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className=" space-y-4 mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          Create New Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* === ORDER BASIC INFO === */}
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="dateOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Order</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="salesCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SALES">Sales</SelectItem>
                        <SelectItem value="SAMPLE">Sample</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="poNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter PO number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client / PIC</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="shippingAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Shipping Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Shipping address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === SALES & VENDOR === */}
            <div className="grid items-start md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="salesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIC Sales Goenakan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sales" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sales.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="vendorIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendors</FormLabel>
                    <Select
                      onValueChange={(val) =>
                        field.onChange([...new Set([...field.value, val])])
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendors" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {field.value?.length > 0 && (
                      <ul className="mt-2 border rounded p-2 space-y-1 text-sm">
                        {field.value.map((id) => {
                          const vendor = vendors.find((v) => v.id === id);
                          return (
                            <li
                              key={id}
                              className="flex justify-between items-center border-b last:border-0 pb-1"
                            >
                              <span>{vendor?.companyName}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  field.onChange(
                                    field.value.filter((vId) => vId !== id)
                                  )
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* === PRODUCTS === */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Products</h3>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid md:grid-cols-5 gap-3 border rounded-lg p-3"
                >
                  <FormField
                    control={control}
                    name={`products.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`products.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qty</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`products.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`products.${index}.customization`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Customization & Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Color red, 500ml, Printing: Screen..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    productId: "",
                    quantity: 1,
                    price: 0,
                    customization: "",
                    remarks: "",
                  })
                }
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Add Another Product
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Order"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
