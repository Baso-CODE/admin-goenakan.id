"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Check, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { useState } from "react";
import { toast } from "sonner";

type SampleFollowUp = {
  id: string;
  name: string;
  date: string | Date;
  isDone: boolean;
  createdAt: string | Date;
};

interface OrderSampleFollowUpsProps {
  orderId: string;
  followUps: SampleFollowUp[];
  onUpdate: () => void;
}

const getStepStyle = (name: string, isDone: boolean) => {
  const lower = name.toLowerCase();
  if (lower.includes("convert to sales"))
    return {
      dot: isDone ? "bg-green-500" : "bg-gray-300",
      badge: "bg-green-100 text-green-700 border-green-200",
      label: "text-green-700",
      border: isDone ? "border-green-200 bg-green-50" : "border-gray-100",
    };
  if (lower.includes("convert to sample"))
    return {
      dot: isDone ? "bg-purple-500" : "bg-gray-300",
      badge: "bg-purple-100 text-purple-700 border-purple-200",
      label: "text-purple-700",
      border: isDone ? "border-purple-200 bg-purple-50" : "border-gray-100",
    };
  return {
    dot: isDone ? "bg-blue-500" : "bg-gray-300",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    label: "text-blue-700",
    border: isDone ? "border-blue-200 bg-blue-50" : "border-gray-100",
  };
};

export function OrderSampleFollowUps({
  orderId,
  followUps,
  onUpdate,
}: OrderSampleFollowUpsProps) {
  const { fetchApi, status } = useApi();

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleDone = async (fu: SampleFollowUp) => {
    if (status !== "authenticated") return;

    try {
      setLoadingId(fu.id);

      const res = await fetchApi(
        `/orders/${orderId}/sample-followups/${fu.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isDone: !fu.isDone }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal update");
      }

      toast.success(fu.isDone ? "Ditandai belum selesai" : "Ditandai selesai");
      onUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mengupdate status");
    } finally {
      setLoadingId(null);
    }
  };

  if (!followUps || followUps.length === 0) return null;

  const doneCount = followUps.filter((f) => f.isDone).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Sample Follow Up Plan
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{followUps.length} selesai
        </span>
      </CardHeader>

      <CardContent>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4">
          <div
            className="h-1.5 bg-blue-500 rounded-full transition-all"
            style={{
              width: `${followUps.length > 0 ? (doneCount / followUps.length) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Stepper */}
        <div className="relative">
          <div className="absolute left-3.75 top-4 bottom-4 w-0.5 bg-gray-100 z-0" />

          <div className="space-y-2">
            {followUps.map((fu, idx) => {
              const style = getStepStyle(fu.name, fu.isDone);
              const isLoading = loadingId === fu.id;

              return (
                <div key={fu.id} className="relative z-10">
                  <div
                    className={`flex items-center gap-3 rounded-lg border p-2.5 transition-all ${style.border}`}>
                    {/* Dot / Number */}
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${style.dot}`}>
                      {fu.isDone ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold ${fu.isDone ? style.label : "text-gray-500"}`}>
                          {fu.name}
                        </span>
                        {fu.isDone && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 px-1.5 border ${style.badge}`}>
                            Selesai
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Rencana:{" "}
                        {format(new Date(fu.date), "dd MMM yyyy", {
                          locale: idLocale,
                        })}
                      </p>
                    </div>

                    {/* Toggle Button */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggleDone(fu)}
                      className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-all shrink-0 ${
                        fu.isDone
                          ? "bg-gray-100 text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                          : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                      } disabled:opacity-50`}>
                      {isLoading
                        ? "..."
                        : fu.isDone
                          ? "Batal"
                          : "Tandai Selesai"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
