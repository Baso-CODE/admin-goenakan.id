"use client";

import React, { useCallback, useEffect, useState } from "react";
import { WaPipelineBoardStage, WaPipelineLead } from "@/types/waPortal.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Settings2,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface WaPipelineKanbanProps {
  sessionId: string;
  onOpenChat: (roomId: string) => void;
  onOpenSettings: () => void;
}

export const WaPipelineKanban: React.FC<WaPipelineKanbanProps> = ({
  sessionId,
  onOpenChat,
  onOpenSettings,
}) => {
  const [stages, setStages] = useState<WaPipelineBoardStage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [draggedLead, setDraggedLead] = useState<{ leadId: string; fromStageId: string } | null>(null);
  const [activeDragOverStageId, setActiveDragOverStageId] = useState<string | null>(null);

  const fetchBoard = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const url = sessionId
        ? `/api/wa/pipeline/board?sessionId=${encodeURIComponent(sessionId)}`
        : `/api/wa/pipeline/board`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Gagal mengambil data board");
      }
      const data = await res.json();
      if (data?.success && Array.isArray(data.stages)) {
        setStages(data.stages);
      }
    } catch (err: any) {
      if (!silent) toast.error(err.message || "Gagal memuat papan pipeline");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleDragStart = (e: React.DragEvent, leadId: string, fromStageId: string) => {
    setDraggedLead({ leadId, fromStageId });
    e.dataTransfer.setData("application/json", JSON.stringify({ leadId, fromStageId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (activeDragOverStageId !== stageId) {
      setActiveDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: string) => {
    // Only reset if leaving the column element itself
    if (activeDragOverStageId === stageId) {
      setActiveDragOverStageId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setActiveDragOverStageId(null);

    const leadInfo = draggedLead;
    setDraggedLead(null);
    if (!leadInfo || leadInfo.fromStageId === targetStageId) return;

    const { leadId, fromStageId } = leadInfo;

    // Optimistically move lead in local state
    let movedLead: WaPipelineLead | null = null;
    const previousStages = stages;

    setStages((current) =>
      current.map((st) => {
        if (st.id === fromStageId) {
          const lead = st.leads.find((l) => l.id === leadId);
          if (lead) movedLead = { ...lead, stageId: targetStageId };
          return {
            ...st,
            leads: st.leads.filter((l) => l.id !== leadId),
          };
        }
        return st;
      }).map((st) => {
        if (st.id === targetStageId && movedLead) {
          return {
            ...st,
            leads: [movedLead, ...st.leads],
          };
        }
        return st;
      })
    );

    try {
      const res = await fetch(`/api/wa/contacts/${encodeURIComponent(leadId)}/stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: targetStageId, sessionId }),
      });

      if (!res.ok) {
        throw new Error("Gagal mengupdate stage");
      }
      toast.success("Stage berhasil diperbarui");
    } catch (err: any) {
      // Rollback on failure
      setStages(previousStages);
      toast.error(err.message || "Gagal memindahkan lead");
    }
  };

  const formatLeadTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "Baru saja";
    if (diffMinutes < 60) return `${diffMinutes}m lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-stone-100/60 rounded-xl border border-stone-200 overflow-hidden">
      {/* Kanban Top Toolbar */}
      <div className="p-3 bg-white border-b border-stone-200 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
            <Input
              placeholder="Cari prospek atau nomor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-stone-50 border-stone-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchBoard()}
            disabled={isLoading}
            className="h-8 text-xs text-stone-700 gap-1.5"
            title="Segarkan data board"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenSettings}
            className="h-8 text-xs text-stone-700 gap-1.5 border-stone-300"
          >
            <Settings2 className="w-3.5 h-3.5 text-stone-500" />
            <span>Atur Stage & Label</span>
          </Button>
        </div>
      </div>

      {/* Kanban Columns Horizontal Scroll Area */}
      <div className="flex-1 min-h-0 overflow-x-auto p-4 flex gap-4 items-stretch">
        {isLoading && stages.length === 0 ? (
          <div className="flex items-center justify-center w-full h-64 text-stone-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-stone-500" />
            <span className="text-xs">Memuat papan pipeline lead...</span>
          </div>
        ) : stages.length === 0 ? (
          <div className="flex items-center justify-center w-full h-64 text-stone-400 text-xs">
            Belum ada tahapan pipeline yang dikonfigurasi.
          </div>
        ) : (
          stages.map((stage) => {
            const isDragTarget = activeDragOverStageId === stage.id;
            const filteredLeads = stage.leads.filter((l) => {
              if (!search.trim()) return true;
              const q = search.toLowerCase();
              return (
                l.name.toLowerCase().includes(q) ||
                l.phoneNumber.toLowerCase().includes(q) ||
                (l.lastMessage && l.lastMessage.toLowerCase().includes(q))
              );
            });

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`w-72 shrink-0 flex flex-col bg-stone-50 rounded-xl border transition-all duration-150 ${
                  isDragTarget
                    ? "border-2 border-dashed shadow-md scale-[1.01]"
                    : "border-stone-200/80 shadow-2xs"
                }`}
                style={
                  isDragTarget
                    ? { borderColor: stage.color, backgroundColor: `${stage.color}08` }
                    : undefined
                }
              >
                {/* Stage Header */}
                <div className="p-3 border-b border-stone-200/80 bg-white/90 rounded-t-xl flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h4 className="font-semibold text-xs text-stone-900 truncate">
                      {stage.name}
                    </h4>
                  </div>
                  <span className="bg-stone-100 text-stone-600 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                    {stage.leads.length}
                  </span>
                </div>

                {/* Leads Cards Container */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">
                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 text-[11px]">
                      {search ? "Tidak ada hasil" : "Belum ada lead"}
                    </div>
                  ) : (
                    filteredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id, stage.id)}
                        className="bg-white p-3 rounded-lg border border-stone-200/90 shadow-2xs hover:shadow-sm hover:border-stone-300 transition-all cursor-grab active:cursor-grabbing group"
                      >
                        {/* Header: Avatar, Name, Phone */}
                        <div className="flex items-start gap-2.5">
                          <Avatar className="w-8 h-8 border shrink-0">
                            {lead.pictureUrl ? (
                              <AvatarImage src={lead.pictureUrl} alt={lead.name} />
                            ) : null}
                            <AvatarFallback className="bg-stone-100 text-stone-700 text-xs font-semibold">
                              {lead.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-xs text-stone-900 truncate leading-snug">
                              {lead.name}
                            </h5>
                            <p className="text-[10px] text-stone-400 font-mono truncate">
                              {lead.phoneNumber.startsWith("62")
                                ? `+62 ${lead.phoneNumber.slice(2)}`
                                : lead.phoneNumber}
                            </p>
                          </div>
                        </div>

                        {/* Last Message Preview */}
                        {lead.lastMessage && (
                          <div className="mt-2 text-[11px] text-stone-600 line-clamp-2 bg-stone-50/70 p-1.5 rounded border border-stone-100">
                            {lead.lastMessage}
                          </div>
                        )}

                        {/* Labels pills */}
                        {lead.labels && lead.labels.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1 mt-2">
                            {lead.labels.map((lbl) => (
                              <span
                                key={lbl.id}
                                className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-medium"
                                style={{
                                  backgroundColor: `${lbl.color}15`,
                                  color: lbl.color,
                                  border: `1px solid ${lbl.color}35`,
                                }}
                              >
                                {lbl.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Footer: Timestamp & Action */}
                        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-stone-100">
                          <span className="inline-flex items-center gap-1 text-[10px] text-stone-400">
                            <Clock className="w-3 h-3" />
                            {formatLeadTime(lead.lastMessageTimestamp)}
                          </span>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onOpenChat(lead.id)}
                            className="h-6 text-[11px] px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 font-medium cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Buka Chat</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
