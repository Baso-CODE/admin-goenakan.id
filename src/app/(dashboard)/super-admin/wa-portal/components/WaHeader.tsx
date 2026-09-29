"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WaHealthResponse, WaSession } from "@/types/waPortal.type";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Send,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

interface WaHeaderProps {
  health: WaHealthResponse | null;
  isHealthLoading: boolean;
  sessions: WaSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  stats: {
    totalMessages: number;
    sentToday: number;
    pendingQueue: number;
    failedMessages: number;
  };
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function WaHeader({
  health,
  isHealthLoading,
  sessions,
  activeSessionId,
  onSelectSession,
  stats,
  onRefresh,
  isRefreshing = false,
}: WaHeaderProps) {
  const isOnline = health?.status === "ok" || health?.status === "healthy";
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Top Bar: Title, Service Status & Quick Controls ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                WhatsApp Management Portal
              </h1>
              <p className="text-xs text-stone-500">
                Hub kontrol pengiriman pesan, pemantauan session, QR pairing, dan audit trails.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Service Health Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white shadow-2xs text-xs">
            {isHealthLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-400" />
                <span className="text-stone-500 font-medium">Checking Service...</span>
              </>
            ) : isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-emerald-700 font-semibold">Service Online</span>
                {health?.version && (
                  <span className="text-stone-400 font-mono text-[10px]">v{health.version}</span>
                )}
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-600 font-semibold">Service Offline / Unreachable</span>
              </>
            )}
          </div>

          {/* Active Session Switcher */}
          {sessions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Select value={activeSessionId} onValueChange={onSelectSession}>
                <SelectTrigger className="w-[180px] h-8 text-xs bg-white">
                  <Smartphone className="w-3.5 h-3.5 mr-1 text-stone-500" />
                  <SelectValue placeholder="Pilih Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{s.name}</span>
                        <span
                          className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                            s.status === "WORKING"
                              ? "bg-emerald-100 text-emerald-700"
                              : s.status === "SCAN_QR_CODE"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Global Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900"
            title="Segarkan data portal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          {/* Dedicated Live Chat Inbox Shortcut */}
          <Link href="/super-admin/wa-portal/live-chat">
            <Button
              size="sm"
              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-2xs font-semibold cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Buka Live Chat</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Metric Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="shadow-2xs border-stone-200">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Total Pesan
              </p>
              <h3 className="text-xl font-bold text-stone-800 mt-0.5">
                {stats.totalMessages.toLocaleString()}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-stone-200">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Terkirim Hari Ini
              </p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">
                {stats.sentToday.toLocaleString()}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-stone-200">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Antrean & Terjadwal
              </p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5">
                {stats.pendingQueue.toLocaleString()}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-stone-200">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Device / Sessions
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <h3 className="text-xl font-bold text-stone-800">
                  {sessions.filter((s) => s.status === "WORKING").length}
                </h3>
                <span className="text-xs text-stone-400 font-medium">
                  / {sessions.length} aktif
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
