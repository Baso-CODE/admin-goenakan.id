"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/helper/debounce";
import { useApi } from "@/hooks/useApi";
import {
  Building2,
  Check,
  Link2,
  Loader2,
  Mail,
  Package,
  Phone,
  Search,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface CustomerSearchResult {
  id: string;
  accountType: "INDIVIDUAL" | "CORPORATE" | string;
  companyName?: string | null;
  picName?: string | null;
  phone?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  totalOrders: number;
}

interface LinkCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  leadPhone: string;
  onSuccess: () => void;
}

export function LinkCustomerDialog({
  open,
  onOpenChange,
  leadId,
  leadPhone,
  onSuccess,
}: LinkCustomerDialogProps) {
  const { fetchApi } = useApi();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  // Auto search saat modal dibuka menggunakan nomor HP lead
  useEffect(() => {
    if (open && leadPhone) {
      setSearch(leadPhone);
    }
  }, [open, leadPhone]);

  useEffect(() => {
    if (!open) {
      setResults([]);
      return;
    }

    const searchCustomers = async () => {
      try {
        setIsLoading(true);
        const res = await fetchApi(
          `/crm/leads/customers/search?q=${encodeURIComponent(debouncedSearch)}`
        );
        if (!res.ok) return;
        const json = await res.json();
        setResults(Array.isArray(json.data) ? json.data : []);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    searchCustomers();
  }, [debouncedSearch, open, fetchApi]);

  const handleLink = async (customerProfileId: string) => {
    if (!leadId) return;

    try {
      setLinkingId(customerProfileId);
      const res = await fetchApi(`/crm/leads/${leadId}/link-customer`, {
        method: "POST",
        body: JSON.stringify({ customerProfileId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menghubungkan customer");
      }

      toast.success("Lead berhasil dihubungkan ke data customer ERP!");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menghubungkan");
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-stone-900">
            <Link2 className="w-4 h-4 text-emerald-600" />
            <span>Hubungkan ke Pelanggan ERP</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            Kaitkan nomor WhatsApp ini ke profil customer yang sudah terdaftar di Goenakan untuk menyinkronkan data perusahaan & pesanan terdahulu.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative pt-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama perusahaan, nama PIC, user, email, atau HP..."
            className="pl-9 h-9 text-xs"
            autoFocus
          />
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-3 min-h-[220px] max-h-[360px] pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-stone-400 text-xs gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span>Mencari di database pelanggan...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-stone-400 text-xs gap-1 border border-dashed rounded-lg">
              <p className="font-medium text-stone-600">Tidak ada pelanggan yang cocok</p>
              <p className="text-[11px]">Coba ubah kata kunci nama perusahaan atau nomor telepon.</p>
            </div>
          ) : (
            results.map((c) => {
              const isCorporate = c.accountType === "CORPORATE";
              const isLinking = linkingId === c.id;

              return (
                <div
                  key={c.id}
                  className="p-3 bg-white border border-stone-200 rounded-xl hover:border-emerald-500 hover:shadow-sm transition-all flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-900 text-xs">
                        {isCorporate
                          ? c.companyName || "Perusahaan Tanpa Nama"
                          : c.userName || "Customer Retail"}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          isCorporate
                            ? "bg-purple-50 text-purple-700 border-purple-200 text-[10px]"
                            : "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                        }
                      >
                        {isCorporate ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" /> Corporate
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="w-2.5 h-2.5" /> Retail
                          </span>
                        )}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-stone-500">
                      {isCorporate && c.picName && (
                        <p className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>PIC: {c.picName}</span>
                        </p>
                      )}
                      {c.phone && (
                        <p className="flex items-center gap-1 truncate">
                          <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{c.phone}</span>
                        </p>
                      )}
                      {c.userEmail && (
                        <p className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{c.userEmail}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-1 text-emerald-700 font-medium">
                        <Package className="w-3 h-3 shrink-0" />
                        <span>{c.totalOrders} Pesanan Terdahulu</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isLinking}
                    onClick={() => handleLink(c.id)}
                    className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5"
                  >
                    {isLinking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tautkan</span>
                      </>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
