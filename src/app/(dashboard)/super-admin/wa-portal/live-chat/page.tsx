"use client";

import { Button } from "@/components/ui/button";
import { WaSession } from "@/types/waPortal.type";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { WaChatRoomManager } from "../components/WaChatRoomManager";

function WaLiveChatContent() {
  const [sessions, setSessions] = useState<WaSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/wa/sessions");
      if (!res.ok) return;
      const data = await res.json();
      const items: WaSession[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setSessions(items);

      if (items.length > 0 && !activeSessionId) {
        const working = items.find((s) => s.status === "WORKING");
        setActiveSessionId(working ? working.id : items[0].id);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-poll if any session is in STARTING state
  useEffect(() => {
    const hasStarting = sessions.some((s) => s.status === "STARTING");
    if (!hasStarting) return;

    const timer = setInterval(() => {
      fetchSessions();
    }, 3000);

    return () => clearInterval(timer);
  }, [sessions]);

  return (
    <div className="space-y-3 pb-1">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/super-admin/wa-portal">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs text-stone-600 hover:text-stone-900 gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke WA Portal</span>
            </Button>
          </Link>
        </div>

        <Link href="/super-admin/wa-portal?tab=sessions">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs text-stone-500 hover:text-stone-800 gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Kelola Sesi & Perangkat</span>
          </Button>
        </Link>
      </div>

      {/* Main Dual-Pane Live Chat Component */}
      <WaChatRoomManager
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        isDedicatedPage={true}
      />
    </div>
  );
}

export default function WaLiveChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-xs text-stone-400">
          Memuat WhatsApp Live Chat...
        </div>
      }
    >
      <WaLiveChatContent />
    </Suspense>
  );
}
