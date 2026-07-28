"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Loader2, Megaphone, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Pastikan import komponen UI dan hooks ini sesuai dengan struktur foldermu
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";

// Tipe data untuk meta paginasi
interface Meta {
  page: number;
  take: number;
  total: number;
  totalPage: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// Tipe data yang diharapkan dari backend
interface GlobalFollowUp {
  id: string;
  date: string;
  name: string | null;
  method: string | null;
  notes: string | null;
  nextAction: string | null;
  quotation: {
    id: string;
    quotationNumber: string | null;
    client?: {
      b2b?: { companyName: string } | null;
      b2c?: { name: string } | null;
    };
  };
}

export default function GlobalFollowUpTable() {
  const { fetchApi, status } = useApi();
  const [data, setData] = useState<GlobalFollowUp[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // State untuk pencarian dan paginasi
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 800);
  const [page, setPage] = useState(1);

  const fetchGlobalFollowUps = useCallback(async () => {
    if (status === "loading" || status === "unauthenticated") return;

    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), take: "10" });
      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await fetchApi(`/quotations/follow-ups/all?${params}`);

      if (!res.ok) throw new Error("Gagal mengambil data follow up global");

      const result = await res.json();

      // Menyesuaikan struktur data yang dikembalikan oleh backend (data & meta)
      setData(result.data || []);
      setMeta(result.meta || null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat semua riwayat follow up");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, fetchApi]);

  // Reset ke halaman 1 setiap kali kata kunci pencarian berubah
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchGlobalFollowUps();
  }, [fetchGlobalFollowUps]);

  // Fungsi kecil untuk mendapatkan nama klien dengan aman
  const getClientName = (client: any) => {
    if (!client) return "-";
    if (client.b2b?.companyName) return client.b2b.companyName;
    if (client.b2c?.name) return client.b2c.name;
    return "-";
  };

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Aktivitas Follow Up
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau seluruh riwayat interaksi dan follow up dari semua Quotation
            di sini.
          </p>
        </div>

        {/* Kolom Search dengan Debounce */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari aktivitas atau nomor qtn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="bg-white border-b py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600" />
            Daftar Interaksi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-40 pl-6">Tanggal</TableHead>
                  <TableHead>No. Quotation & Klien</TableHead>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="min-w-50">Catatan</TableHead>
                  <TableHead className="pr-6">Aksi Selanjutnya</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 align-top font-medium text-slate-700 whitespace-nowrap">
                      {format(new Date(item.date), "dd MMM yyyy", {
                        locale: idLocale,
                      })}
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        {format(new Date(item.date), "HH:mm", {
                          locale: idLocale,
                        })}{" "}
                        WIB
                      </div>
                    </TableCell>

                    <TableCell className="align-top">
                      <Link
                        href={`/quotations/${item.quotation.id}`}
                        className="font-bold text-blue-600 hover:underline">
                        {item.quotation.quotationNumber || "Draft"}
                      </Link>
                      <div className="text-xs text-slate-600 mt-1 uppercase">
                        {getClientName(item.quotation.client)}
                      </div>
                    </TableCell>

                    <TableCell className="align-top font-semibold text-slate-800">
                      {item.name || "-"}
                    </TableCell>

                    <TableCell className="align-top">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {item.method || "-"}
                      </span>
                    </TableCell>

                    <TableCell className="align-top">
                      {item.notes ? (
                        <div className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed">
                          {item.notes}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">-</span>
                      )}
                    </TableCell>

                    <TableCell className="pr-6 align-top">
                      {item.nextAction ? (
                        <div className="bg-orange-50 text-orange-700 text-xs px-2.5 py-1.5 rounded-md border border-orange-100/60 inline-block font-medium">
                          {item.nextAction}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {data.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-slate-500">
                      Belum ada data follow up sama sekali.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {meta && (
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="text-xs text-muted-foreground">
            Halaman <strong>{meta.page}</strong> dari{" "}
            <strong>{meta.totalPage}</strong> • Total{" "}
            <strong>{meta.total}</strong> Data
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 text-xs bg-white">
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs bg-white">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
