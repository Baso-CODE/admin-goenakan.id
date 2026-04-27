"use client";

import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NoteCategoryForm, {
  NoteCategoryFormValues,
} from "../../components/noteCategoryForm";

const AddNoteCategoryPage = () => {
  const { fetchApi, status } = useApi();
  const router = useRouter();

  const handleAddCategory = async (data: NoteCategoryFormValues) => {
    if (status !== "authenticated") {
      toast.error("Sesi berakhir, silakan login kembali.");
      return;
    }

    try {
      const res = await fetchApi("/invoice-notes/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to create category");
      }

      toast.success("Category created successfully!");
      router.push("/admin-invoice/notes");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create category",
      );
    }
  };
  return (
    <div className="space-y-6 w-full mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Add New Note Category
          </h2>
          <p className="text-sm text-muted-foreground">
            Create a new category for invoice notes.
          </p>
        </div>
      </div>

      <NoteCategoryForm onSubmit={handleAddCategory} />
    </div>
  );
};

export default AddNoteCategoryPage;
