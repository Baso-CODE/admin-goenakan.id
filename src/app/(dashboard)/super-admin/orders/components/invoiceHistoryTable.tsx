import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { FileText } from "lucide-react";
import Link from "next/link";
import { OrderInvoice } from "../types/order.types";

interface InvoiceHistoryTableProps {
  invoices: OrderInvoice[];
}

export function InvoiceHistoryTable({ invoices }: InvoiceHistoryTableProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-gray-500" />
          Invoice History
        </CardTitle>
        <CardDescription>
          Riwayat tagihan yang telah dibuat untuk order ini
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Invoice</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length > 0 ? (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-xs">
                    {inv.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {inv.category.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(inv.createdAt), "dd MMM yyyy", {
                      locale: idLocale,
                    })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(inv.totalAmount))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className="text-[10px]"
                      variant={
                        inv.status === "PAID"
                          ? "default"
                          : inv.status === "UNPAID"
                            ? "secondary"
                            : "destructive"
                      }>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin-invoice/invoices/${inv.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Detail
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground text-sm">
                  Belum ada invoice yang dibuat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
