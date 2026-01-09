"use client";

import { fetchWithToken } from "@/app/(dashboard)/super-admin/orders/order-service"; // Sesuaikan path import
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

// Helper Format Rupiah
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export function RecentSales() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        // Ambil 5 invoice terakhir yang statusnya PAID
        // Asumsi kamu punya endpoint getAllInvoices, kita filter di backend atau ambil page 1
        const res = await fetchWithToken(
          "http://localhost:8000/invoices?take=5&status=PAID"
        );
        setSales(res.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Transaksi Terakhir</CardTitle>
        <CardDescription>
          5 pembayaran invoice terakhir yang masuk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            {sales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                Belum ada transaksi.
              </p>
            ) : (
              sales.map((sale) => {
                // Ambil inisial nama untuk Avatar (Misal: "Budi Santoso" -> "BS")
                const name = sale.clientName || "Unknown";
                const initials = name.match(/\b\w/g) || [];
                const avatarText = (
                  (initials.shift() || "") + (initials.pop() || "")
                ).toUpperCase();

                return (
                  <div className="flex items-center" key={sale.id}>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{avatarText}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.poNumber}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      +{formatCurrency(sale.totalAmount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
