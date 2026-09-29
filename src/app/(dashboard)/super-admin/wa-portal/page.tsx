"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WaHealthResponse, WaMessage, WaSession } from "@/types/waPortal.type";
import {
  Calendar,
  History,
  MessageSquare,
  Rss,
  Send,
  Smartphone,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { WaHeader } from "./components/WaHeader";
import { WaMessageLogs } from "./components/WaMessageLogs";
import { WaMessageScheduler } from "./components/WaMessageScheduler";
import { WaMessageSender } from "./components/WaMessageSender";
import { WaSessionManager } from "./components/WaSessionManager";
import { WaWebhookManager } from "./components/WaWebhookManager";

function WaPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "sessions";

  const [activeTab, setActiveTab] = useState(currentTab);
  const [health, setHealth] = useState<WaHealthResponse | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  const [sessions, setSessions] = useState<WaSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalMessages: 0,
    sentToday: 0,
    pendingQueue: 0,
    failedMessages: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync tab with URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`/super-admin/wa-portal?${params.toString()}`);
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Fetch Health status
  const fetchHealth = async () => {
    try {
      setIsHealthLoading(true);
      const res = await fetch("/api/wa/health");
      if (!res.ok) {
        setHealth({ status: "offline" });
        return;
      }
      const data = await res.json();
      setHealth(data?.data || data);
    } catch {
      setHealth({ status: "offline" });
    } finally {
      setIsHealthLoading(false);
    }
  };

  // Fetch Sessions list
  const fetchSessions = async () => {
    try {
      setIsSessionsLoading(true);
      const res = await fetch("/api/wa/sessions");
      if (!res.ok) return;
      const data = await res.json();
      const items: WaSession[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setSessions(items);

      // Default active session to working session or first session, or clear if empty
      if (items.length === 0) {
        setActiveSessionId("");
      } else if (!items.some((s) => s.id === activeSessionId)) {
        const working = items.find((s) => s.status === "WORKING");
        setActiveSessionId(working ? working.id : items[0].id);
      }
    } catch {
      // ignore
    } finally {
      setIsSessionsLoading(false);
    }
  };

  // Compute overview stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/wa/messages?limit=100");
      if (!res.ok) return;
      const data = await res.json();
      const items: WaMessage[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const todayStr = new Date().toISOString().split("T")[0];
      const sentToday = items.filter(
        (m) => m.status === "SENT" && m.createdAt && m.createdAt.startsWith(todayStr)
      ).length;
      const pendingQueue = items.filter(
        (m) => m.status === "PENDING" || m.status === "PROCESSING"
      ).length;
      const failed = items.filter((m) => m.status === "FAILED").length;

      setStats({
        totalMessages: items.length,
        sentToday,
        pendingQueue,
        failedMessages: failed,
      });
    } catch {
      // ignore
    }
  };

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchHealth(), fetchSessions(), fetchStats()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    handleGlobalRefresh();
  }, []);

  // Auto-poll sessions while any session is in STARTING status
  useEffect(() => {
    const hasStarting = sessions.some((s) => s.status === "STARTING");
    if (!hasStarting) return;

    const timer = setInterval(() => {
      fetchSessions();
    }, 3000);

    return () => clearInterval(timer);
  }, [sessions]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header & Stats ── */}
      <WaHeader
        health={health}
        isHealthLoading={isHealthLoading}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        stats={stats}
        onRefresh={handleGlobalRefresh}
        isRefreshing={isRefreshing}
      />

      {/* ── Main Tabbed Content ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="bg-stone-100/90 p-1 border border-stone-200/80 rounded-lg flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="sessions"
            className="text-xs data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-2xs font-semibold px-3 py-1.5 gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5 text-stone-500" />
            Device & Sessions
          </TabsTrigger>

          <TabsTrigger
            value="send"
            className="text-xs data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-2xs font-semibold px-3 py-1.5 gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-stone-500" />
            Kirim Pesan
          </TabsTrigger>

          <TabsTrigger
            value="schedule"
            className="text-xs data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-2xs font-semibold px-3 py-1.5 gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            Jadwal Pesan
          </TabsTrigger>

          <TabsTrigger
            value="logs"
            className="text-xs data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-2xs font-semibold px-3 py-1.5 gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-stone-500" />
            Riwayat & Audit
          </TabsTrigger>

          <TabsTrigger
            value="webhooks"
            className="text-xs data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-2xs font-semibold px-3 py-1.5 gap-1.5"
          >
            <Rss className="w-3.5 h-3.5 text-stone-500" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Sessions */}
        <TabsContent value="sessions" className="space-y-4 focus-visible:outline-none">
          <WaSessionManager
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onRefresh={fetchSessions}
            isLoading={isSessionsLoading}
          />
        </TabsContent>

        {/* Tab 2: Send Message */}
        <TabsContent value="send" className="space-y-4 focus-visible:outline-none">
          <WaMessageSender
            sessions={sessions}
            activeSessionId={activeSessionId}
            onMessageSent={() => {
              fetchStats();
            }}
          />
        </TabsContent>

        {/* Tab 3: Schedule Message */}
        <TabsContent value="schedule" className="space-y-4 focus-visible:outline-none">
          <WaMessageScheduler
            sessions={sessions}
            activeSessionId={activeSessionId}
            onScheduled={() => {
              fetchStats();
            }}
          />
        </TabsContent>

        {/* Tab 4: Message Logs */}
        <TabsContent value="logs" className="space-y-4 focus-visible:outline-none">
          <WaMessageLogs activeSessionId={activeSessionId} />
        </TabsContent>

        {/* Tab 5: Webhooks */}
        <TabsContent value="webhooks" className="space-y-4 focus-visible:outline-none">
          <WaWebhookManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function WaPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="h-48 flex items-center justify-center text-xs text-stone-400">
          Memuat WhatsApp Portal...
        </div>
      }
    >
      <WaPortalContent />
    </Suspense>
  );
}
