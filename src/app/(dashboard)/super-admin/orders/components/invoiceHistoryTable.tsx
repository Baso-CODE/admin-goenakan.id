"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

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

import { ConfirmDeleteDialog } from "@/app/(dashboard)/components/confirmDeleteDialog";
import { useApi } from "@/hooks/useApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { OrderInvoice } from "../types/order.types";

interface InvoiceHistoryTableProps {
  invoices: OrderInvoice[];
  onDeleted?: () => void | Promise<void>;
}

export function InvoiceHistoryTable({
  invoices,
  onDeleted,
}: InvoiceHistoryTableProps) {
  const { fetchApi } = useApi();

  const [selectedInvoice, setSelectedInvoice] = useState<OrderInvoice | null>(
    null,
  );

  const [isDeleting, setIsDeleting] = useState(false);

  const handleCloseDialog = () => {
    if (isDeleting) return;
    setSelectedInvoice(null);
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice || isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await fetchApi(`/invoices/${selectedInvoice.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(errorData.message || "Gagal menghapus invoice");
      }

      toast.success("Invoice berhasil dihapus");

      setSelectedInvoice(null);

      // Refresh data dari parent.
      if (onDeleted) {
        await onDeleted();
      }
    } catch (error) {
      console.error("Delete invoice error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus invoice",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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

        <CardContent className="p-4">
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
                invoices.map((inv) => {
                  const canDelete = inv.status !== "PAID";

                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-xs">
                        {inv.invoiceNumber || `INV/${inv.id}`}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {inv.category.replaceAll("_", " ")}
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

                      <TableCell>
                        <div className="flex justify-end items-center gap-2">
                          {/* DETAIL */}
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs">
                            <Link href={`/admin-invoice/invoices/${inv.id}`}>
                              Detail
                            </Link>
                          </Button>

                          {/* DELETE */}
                          {canDelete && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isDeleting}
                              onClick={() => setSelectedInvoice(inv)}
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Hapus Invoice">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDeleteDialog
        isOpen={selectedInvoice !== null}
        onClose={handleCloseDialog}
        onConfirm={handleDeleteInvoice}
        isLoading={isDeleting}
        title="Hapus Invoice?"
        description={`Apakah Anda yakin ingin menghapus invoice ${
          selectedInvoice?.invoiceNumber || `INV/${selectedInvoice?.id ?? "-"}`
        }?`}
        warningMessage="Invoice beserta item dan catatannya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
      />
    </>
  );
}
