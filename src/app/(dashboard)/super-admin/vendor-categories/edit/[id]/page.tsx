"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import VendorCategoryForm, {
  VendorCategoryFormValues,
} from "../../components/formCategoryVendor";

const EditCategoryVendor = () => {
  const { id } = useParams();
  const [categoryData, setCategoryData] = useState<
    VendorCategoryFormValues | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Mulai loading
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Failed to get token");
        const { token } = await tokenRes.json();
        const res = await fetch(
          `http://localhost:8000/vendor-categories/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch category data");
        const data = await res.json();
        setCategoryData({
          name: data.name,
          type: data.type,
          description: data.description,
          isActive: data.isActive,
        });
      } catch (err) {
        console.error("❌ Failed to load data:", err);
        setCategoryData(undefined);
        toast.error("Failed to load category data. Using default values.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleUpdateCategoryVendor = async (data: VendorCategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const res = await fetch(`http://localhost:8000/vendor-categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      toast.success("Vendor Category updated successfully!");
      router.push("/super-admin/vendor-categories");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update category"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 ">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Vendor Category
      </h2>

      <VendorCategoryForm
        initialData={categoryData}
        onSubmit={handleUpdateCategoryVendor}
        isLoading={isLoading} // Kirim status loading
        isSubmitting={isSubmitting} // Kirim status submitting
      />
    </div>
  );
};

export default EditCategoryVendor;
