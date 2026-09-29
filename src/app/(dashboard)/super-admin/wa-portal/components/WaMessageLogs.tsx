"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { WaMessage } from "@/types/waPortal.type";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { WaAuditDrawer } from "./WaAuditDrawer";

interface WaMessageLogsProps {
  activeSessionId?: string;
}

export function WaMessageLogs({ activeSessionId }: WaMessageLogsProps) {
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [limit] = useState(15);
  const [offset, setOffset] = useState(0);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/wa/messages?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      const items: WaMessage[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setMessages(items);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [statusFilter, offset]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200 text-[10px] font-bold">
            SENT
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="text-[10px] font-bold">
            FAILED
          </Badge>
        );
      case "PENDING":
      case "PROCESSING":
        return (
          <Badge className="bg-amber-500/15 text-amber-800 hover:bg-amber-500/20 border-amber-200 text-[10px] font-bold">
            {status}
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-stone-500 text-[10px]">
            CANCELLED
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-stone-200 shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b">
          <div>
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              Riwayat Pesan & Audit Log
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Daftar seluruh pesan yang telah diproses oleh WhatsApp Middleware beserta status pengiriman.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filter Status */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs bg-white">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="SENT" className="text-xs">SENT</SelectItem>
                <SelectItem value="FAILED" className="text-xs">FAILED</SelectItem>
                <SelectItem value="PENDING" className="text-xs">PENDING</SelectItem>
                <SelectItem value="CANCELLED" className="text-xs">CANCELLED</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchMessages}
              disabled={isLoading}
              className="h-8 text-xs text-stone-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Segarkan
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/50">
                  <TableHead className="w-[140px] text-xs font-semibold">Tujuan (No. WA)</TableHead>
                  <TableHead className="text-xs font-semibold">Isi Pesan</TableHead>
                  <TableHead className="w-[110px] text-xs font-semibold">Status</TableHead>
                  <TableHead className="w-[160px] text-xs font-semibold">Waktu</TableHead>
                  <TableHead className="w-[110px] text-right text-xs font-semibold">Audit Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-xs text-stone-400">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
                          <span>Memuat riwayat pesan...</span>
                        </div>
                      ) : (
                        "Belum ada catatan riwayat pesan untuk filter ini."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((m) => (
                    <TableRow key={m.id} className="hover:bg-stone-50/60 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-stone-800">
                        +{m.to}
                      </TableCell>

                      <TableCell className="text-xs text-stone-600 max-w-[340px] truncate" title={m.text}>
                        {m.text}
                      </TableCell>

                      <TableCell>{renderStatusBadge(m.status)}</TableCell>

                      <TableCell className="text-xs text-stone-500 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleString("id-ID")}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAuditId(m.id)}
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Audit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-stone-50/40 text-xs text-stone-500">
            <span>
              Menampilkan {messages.length > 0 ? offset + 1 : 0} - {offset + messages.length} data
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0 || isLoading}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                className="h-7 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={messages.length < limit || isLoading}
                onClick={() => setOffset((prev) => prev + limit)}
                className="h-7 px-2.5 text-xs"
              >
                Berikutnya <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Drawer */}
      <WaAuditDrawer
        isOpen={!!selectedAuditId}
        onClose={() => setSelectedAuditId(null)}
        messageId={selectedAuditId}
      />
    </div>
  );
}
