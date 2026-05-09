"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Eye, MessageCircle, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// === TYPES ===
type ContactMessage = {
  id: number;
  name: string;
  email: string;
  phone: string;
  interest: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

// Menambahkan type Meta yang sama dengan Product Categories
type Meta = {
  hasNext: boolean;
  hasPrevious: boolean;
  page: number;
  perPage: number;
  total: number;
};

export default function AdminContactMessage() {
  const { fetchApi, status } = useApi();

  // --- STATE UNTUK TABLE ---
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- STATE UNTUK FILTER & PAGINATION ---
  const [search, setSearch] = useState("");
  // ✨ Menggunakan useDebounce yang jauh lebih bersih
  const debouncedSearch = useDebounce(search, 500);
  const [isReadFilter, setIsReadFilter] = useState("all");
  const [page, setPage] = useState(1);

  // --- STATE UNTUK MODAL DETAIL ---
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // --- FUNGSI FETCH DATA ---
  const fetchMessages = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        take: "10",
      });

      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }
      if (isReadFilter !== "all") {
        params.append("isRead", isReadFilter);
      }

      // Gunakan fetchApi (Otomatis handle Base URL dan Token)
      const res = await fetchApi(`/contact-messages?${params}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP Error ${res.status}`);
      }

      const result = await res.json();
      setMessages(result.data || []);
      setMeta(result.meta);
    } catch (error) {
      console.error("❌ Load Messages Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Gagal memuat daftar pesan");
    } finally {
      setLoading(false);
    }
  };

  // Pantau perubahan pada filter untuk trigger fetch ulang
  useEffect(() => {
    fetchMessages();
  }, [page, debouncedSearch, isReadFilter, status, fetchApi]);

  // Reset page ke 1 jika filter pencarian atau status baca berubah
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, isReadFilter]);

  // --- FUNGSI UPDATE STATUS BACA ---
  const handleViewDetail = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setIsDetailOpen(true);

    if (!msg.isRead && status === "authenticated") {
      try {
        const res = await fetchApi(`/contact-messages/${msg.id}`);

        if (res.ok) {
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)),
          );
        }
      } catch (error) {
        console.error("❌ Gagal update status read:", error);
      }
    }
  };

  // --- FUNGSI HANDLE DELETE ---
  const handleDelete = async (id: number) => {
    if (status !== "authenticated") return;

    if (!window.confirm("Yakin ingin menghapus pesan ini?")) return;

    try {
      const res = await fetchApi(`/contact-messages/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus pesan");
      }

      toast.success("Pesan berhasil dihapus!");
      fetchMessages(); // Refresh data tabel
    } catch (error: any) {
      console.error("❌ Delete Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus pesan");
    }
  };
  // Buka WhatsApp Klien
  const handleReplyWhatsapp = (phone: string, name: string) => {
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.slice(1);
    }

    const text = `Halo Kak ${name}, saya admin dari Goenakan Indonesia. Menanggapi pesan yang dikirimkan melalui website kami terkait...`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className=" min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Contact Inbox</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola dan tanggapi pesan dari calon klien.
        </p>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama, email, atau no. HP..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={isReadFilter} onValueChange={setIsReadFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Pesan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pesan</SelectItem>
              <SelectItem value="false">Belum Dibaca</SelectItem>
              <SelectItem value="true">Sudah Dibaca</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE */}
      <div className="border rounded-md">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Nama & Kontak</TableHead>
              <TableHead>Tertarik Pada</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-gray-500">
                  Tidak ada pesan yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              messages.map((msg) => (
                <TableRow
                  key={msg.id}
                  className={!msg.isRead ? "bg-blue-50/30 font-medium" : ""}>
                  <TableCell>
                    <div className="text-sm text-gray-900">{msg.name}</div>
                    <div className="text-xs text-gray-500">{msg.email}</div>
                    <div className="text-xs text-gray-500">{msg.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {msg.interest || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(msg.createdAt), "dd MMM yyyy, HH:mm", {
                      locale: idLocale,
                    })}
                  </TableCell>
                  <TableCell>
                    {msg.isRead ? (
                      <Badge variant="outline" className="text-gray-500">
                        Read
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500 hover:bg-blue-600">
                        New
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(msg)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 mr-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(msg.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* === PAGINATION === */}
      {meta && (
        <div className="flex justify-between items-center mt-4 p-4 border-t text-sm text-muted-foreground">
          <p className="text-sm text-muted-foreground">
            Halaman {meta.page} dari {Math.ceil(meta.total / meta.perPage)}{" "}
            (Total {meta.total} pesan)
          </p>

          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Sebelumnya
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}>
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Pesan Klien</DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-2 text-sm border-b pb-4">
                <div>
                  <span className="block text-gray-500 text-xs">Nama</span>
                  <span className="font-semibold text-gray-900">
                    {selectedMessage.name}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs">
                    Tanggal Kirim
                  </span>
                  <span className="font-semibold text-gray-900">
                    {format(
                      new Date(selectedMessage.createdAt),
                      "dd MMM yyyy, HH:mm",
                      { locale: idLocale },
                    )}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="block text-gray-500 text-xs">Email</span>
                  <span className="font-semibold text-gray-900">
                    {selectedMessage.email}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="block text-gray-500 text-xs">
                    Telepon / WA
                  </span>
                  <span className="font-semibold text-gray-900">
                    {selectedMessage.phone}
                  </span>
                </div>
                <div className="col-span-2 mt-2">
                  <span className="block text-gray-500 text-xs">
                    Tertarik Pada
                  </span>
                  <Badge variant="secondary" className="mt-1">
                    {selectedMessage.interest || "Tidak spesifik"}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="block text-gray-500 text-xs mb-1">
                  Isi Pesan:
                </span>
                <div className="p-3 bg-stone-50 border rounded-md text-sm text-gray-700 whitespace-pre-wrap min-h-25">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}>
                  Tutup
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() =>
                    handleReplyWhatsapp(
                      selectedMessage.phone,
                      selectedMessage.name,
                    )
                  }>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Balas via WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
