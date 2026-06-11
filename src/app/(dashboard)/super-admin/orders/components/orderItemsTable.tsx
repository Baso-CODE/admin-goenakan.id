import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import { Store } from "lucide-react";
import { OrderProduct } from "../types/order.types";

interface OrderItemsTableProps {
  products: OrderProduct[];
  totalAmount: number;
}

export function OrderItemsTable({
  products,
  totalAmount,
}: OrderItemsTableProps) {
  return (
    <Card className="shadow-sm border-t-4 border-t-primary">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Store className="h-5 w-5 text-gray-500" />
          Items Ordered
        </CardTitle>
        <CardDescription>
          Daftar produk dan detail customization
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Product Details</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-900">
                      {item.productName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      SKU: {item.sku}
                      {item.variantName !== "-" && `• ${item.variantName}`}
                    </span>
                    {(item.customization !== "-" || item.remarks !== "-") && (
                      <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-600 border space-y-1">
                        {item.customization !== "-" && (
                          <p>
                            <span className="font-semibold">Custom:</span>
                            {item.customization}
                          </p>
                        )}
                        {item.remarks !== "-" && (
                          <p>
                            <span className="font-semibold">Note:</span>
                            {item.remarks}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {formatCurrency(item.unitPrice)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(item.totalPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-6 bg-gray-50 flex justify-end">
          <div className="w-full md:w-1/2 space-y-2">
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">
                Grand Total
              </span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
