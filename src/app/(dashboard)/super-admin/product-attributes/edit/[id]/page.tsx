"use client";

import { apiUrl } from "@/helper/apiurl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AttributeForm, {
  AttributeFormValues,
} from "../../components/FormAttributes";

export default function EditAttributePage() {
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
      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/product-attributes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch attribute data");

        const data = await res.json();
        console.log("ini adlah data attributes", data);

        setAttributeData({
          name: data.name,
          values: data.values.map((v: any) => ({ id: v.id, value: v.value })),
        });
      } catch (err) {
        console.error("❌ Failed to load attribute data:", err);
        toast.error("Failed to load attribute data. Using default values.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // === Submit update ===
  const handleUpdateAttribute = async (data: AttributeFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`${apiUrl}/product-attributes/${id}`, {
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

      toast.success("Attribute updated successfully!");
      router.push("/super-admin/product-attributes");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update attribute"
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
