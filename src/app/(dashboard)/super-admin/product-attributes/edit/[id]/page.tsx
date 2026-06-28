"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AttributeForm, {
  AttributeFormValues,
} from "../../components/FormAttributes";

export default function EditAttributePage() {
  const { fetchApi, status } = useApi();

  const { id } = useParams();
  const router = useRouter();

  const [attributeData, setAttributeData] = useState<
    AttributeFormValues | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === Fetch attribute data ===
  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== "authenticated") return;

      setIsLoading(true);
      try {
        const res = await fetchApi(`/product-attributes/${id}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to fetch attribute data");
        }

        const data = await res.json();

        setAttributeData({
          name: data.name,
          values: data.values.map((v: any) => ({ id: v.id, value: v.value, position: v.position })),
        });
      } catch (err: any) {
        console.error("❌ Failed to load attribute data:", err);
        toast.error(err.message || "Failed to load attribute data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, status, fetchApi]); // Tambahkan dependensi auth

  // === Submit update ===
  const handleUpdateAttribute = async (data: AttributeFormValues) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi(`/product-attributes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update attribute");
      }

      toast.success("Attribute updated successfully!");
      router.push("/super-admin/product-attributes");
      router.refresh();
    } catch (err) {
      console.error("❌ Update Attribute Error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update attribute",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Attribute
      </h2>

      <AttributeForm
        initialData={attributeData}
        onSubmit={handleUpdateAttribute}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
