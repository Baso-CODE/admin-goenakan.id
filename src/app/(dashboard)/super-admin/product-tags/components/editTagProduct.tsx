"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiUrl } from "@/helper/apiurl";
import ProductTagForm, { ProductTagFormValues } from "./formTagProduct";

export default function EditProductTag() {
  const { id } = useParams();
  const router = useRouter();

  const [tagData, setTagData] = useState<ProductTagFormValues | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Failed to get token");
        const { token } = await tokenRes.json();

        // Fetch data tag berdasarkan ID
        const res = await fetch(`${apiUrl}/product-tags/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch tag data");

        const data = await res.json();
        setTagData({
          name: data.name,
        });
      } catch (err) {
        console.error("❌ Failed to load data:", err);
        setTagData(undefined);
        toast.error("Failed to load tag data. Using default values.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleUpdateProductTag = async (data: ProductTagFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      // PATCH request ke endpoint product-tags
      const res = await fetch(`${apiUrl}/product-tags/${id}`, {
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

      toast.success("Product Tag updated successfully!");
      router.push("/super-admin/product-tags");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Product Tag
      </h2>

      <ProductTagForm
        initialData={tagData}
        onSubmit={handleUpdateProductTag}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
