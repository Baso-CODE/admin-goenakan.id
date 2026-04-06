"use client";

import { Button } from "@/components/ui/button";
import { apiUrl } from "@/helper/apiurl";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import NoteCategoryForm, {
  NoteCategoryFormValues,
} from "../../../components/noteCategoryForm";

const EditNoteCategoryPage = () => {
  const { slug } = useParams();
  const router = useRouter();

  const [initialData, setInitialData] = useState<
    NoteCategoryFormValues | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // FETCH DATA
  // ============================
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        setIsLoading(true);

        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Failed to get token");
        const { token } = await tokenRes.json();

        // Fetch by SLUG
        const res = await fetch(`${apiUrl}/invoice-notes/categories/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch category data");

        const data = await res.json();

        // Backend response format might be wrapped in { data: ... } or direct object
        // Adjust accordingly based on your controller response
        setInitialData({
          name: data.name || data.data?.name,
          isActive:
            data.isActive !== undefined
              ? data.isActive
              : (data.data?.isActive ?? true),
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load category data.");
        router.push("/admin-invoice/notes"); // Redirect if not found
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, router]);

  // ============================
  // UPDATE DATA
  // ============================
  const handleUpdateCategory = async (formValues: NoteCategoryFormValues) => {
    try {
      setIsSubmitting(true);

      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      // Update by SLUG
      const res = await fetch(`${apiUrl}/invoice-notes/categories/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to update category");
      }

      toast.success("Category updated successfully!");
      router.push("/admin-invoice/notes");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update category",
      );
    } finally {
      setIsSubmitting(false);
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
            Edit Note Category
          </h2>
          <p className="text-sm text-muted-foreground font-mono bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
            Slug: {slug}
          </p>
        </div>
      </div>

      <NoteCategoryForm
        initialData={initialData}
        onSubmit={handleUpdateCategory}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default EditNoteCategoryPage;
