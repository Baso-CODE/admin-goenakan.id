"use client";

import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import EventCategoryForm from "../components/eventCategoryForm";

export default function AddEventCategory() {
  const { fetchApi, status } = useApi();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (formData: FormData) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi("/event-categories", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to create category");
      }

      toast.success("Event Category added successfully!");

      router.push("/super-admin/content/event-categories");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Create Category Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mx-auto py-6">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        Add New Event Category
      </h1>
      <EventCategoryForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
    </div>
  );
}
