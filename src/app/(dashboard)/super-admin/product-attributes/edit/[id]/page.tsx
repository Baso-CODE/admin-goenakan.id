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

  const mapValuesFromApi = (vals: any[]): any[] => {
    return vals.map((v: any) => {
      const mapped: any = {
        id: v.id,
        value: v.value,
        position: v.position,
        hasSubAttributes: !!(v.subAttributes && v.subAttributes.length > 0),
      };
      if (v.subAttributes && v.subAttributes.length > 0) {
        mapped.subAttributes = v.subAttributes.map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          type: sub.type || "TEXT",
          parentValueId: sub.parentValueId,
          values: mapValuesFromApi(sub.values),
        }));
      }
      return mapped;
    });
  };

  const formatValuesRecursive = (values: any[]): any[] => {
    return values.map((v) => {
      const formatted: any = {
        value: v.value,
        position: v.position,
      };
      if (v.id) formatted.id = v.id;
      if (v.deleted) formatted.deleted = v.deleted;
      if (v.subAttributes && v.subAttributes.length > 0) {
        formatted.subAttributes = v.subAttributes.map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          type: sub.type,
          parentValueId: sub.parentValueId,
          deleted: sub.deleted,
          values: formatValuesRecursive(sub.values),
        }));
      }
      return formatted;
    });
  };

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
          type: data.type || "TEXT",
          parentValueId: data.parentValueId || null,
          values: mapValuesFromApi(data.values),
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
      const payload = {
        name: data.name,
        type: data.type,
        parentValueId: data.parentValueId,
        values: formatValuesRecursive(data.values),
      };

      const res = await fetchApi(`/product-attributes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
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
        attributeId={id as string}
      />
    </div>
  );
}
