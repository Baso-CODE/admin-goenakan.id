"use client";

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

// ✨ PERBAIKAN 1: Sesuaikan interface dengan nama kunci dari Backend
interface ProductData {
  sku: string;
  name: string;
  totalQuantity: number | null; // Namanya sekarang 'totalQuantity'
  totalRevenue: number | null;
}

interface SalesTopBottomProductsProps {
  data?: {
    top: ProductData[];
    bottom: ProductData[];
  };
}

export default function SalesTopBottomProducts({
  data,
}: SalesTopBottomProductsProps) {
  // Pisahkan data top dan bottom, gunakan array kosong jika undefined
  const topProducts = data?.top || [];
  const bottomProducts = data?.bottom || [];

  // Fungsi helper untuk memformat angka menjadi Rupiah (aman dari null)
  const formatIDR = (val: number | null) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
      {/* ========================================== */}
      {/* TABEL KIRI: TOP 5 SELLING PRODUCTS         */}
      {/* ========================================== */}
      <Card className="shadow-sm border-emerald-100/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Top 5 Selling Product
          </CardTitle>
          <CardDescription className="text-xs">
            (Berdasarkan rentang waktu filter)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">
                    SKU
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Name
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Total Qty
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Total Revenue
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.length > 0 ? (
                  topProducts.map((item, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs text-slate-500">
                        {item.sku}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>

                      <TableCell className="text-right">
                        {/* ✨ PERBAIKAN 2: Panggil `totalQuantity` */}
                        {(item.totalQuantity || 0).toLocaleString("id-ID")}
                      </TableCell>

                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatIDR(item.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-slate-400 py-4 h-24">
                      Tidak ada data produk terjual
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================== */}
      {/* TABEL KANAN: BOTTOM 5 SELLING PRODUCTS     */}
      {/* ========================================== */}
      <Card className="shadow-sm border-rose-100/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Bottom 5 Selling Product
          </CardTitle>
          <CardDescription className="text-xs">
            (Berdasarkan rentang waktu filter)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">
                    SKU
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Name
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Total Qty
                  </TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Total Revenue
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bottomProducts.length > 0 ? (
                  bottomProducts.map((item, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs text-slate-500">
                        {item.sku}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>

                      <TableCell className="text-right">
                        {/* ✨ PERBAIKAN 3: Panggil `totalQuantity` */}
                        {(item.totalQuantity || 0).toLocaleString("id-ID")}
                      </TableCell>

                      <TableCell className="text-right font-semibold text-rose-600">
                        {formatIDR(item.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-slate-400 py-4 h-24">
                      Tidak ada data produk terjual
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
