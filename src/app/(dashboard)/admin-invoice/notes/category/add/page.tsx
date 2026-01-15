"use client";

import { Button } from "@/components/ui/button";
import { apiUrl } from "@/helper/apiurl";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NoteCategoryForm, {
  NoteCategoryFormValues,
} from "../../components/noteCategoryForm";

const AddNoteCategoryPage = () => {
  const router = useRouter();

  const handleAddCategory = async (data: NoteCategoryFormValues) => {
    try {
      // === GET TOKEN ===
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const res = await fetch(`${apiUrl}/invoice-notes/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to create category");
      }

      toast.success("Category created successfully!");
      router.push("/super-admin/invoice-notes"); // Redirect balik ke list
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create category"
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
