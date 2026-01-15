"use client";

import { apiUrl } from "@/helper/apiurl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import VendorItemForm, {
  VendorItemFormValues,
} from "../../components/formItemVendor";

const EditItemVendor = () => {
  const { id } = useParams();
  const router = useRouter();

  const [itemData, setItemData] = useState<VendorItemFormValues | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === Fetch data item vendor by ID ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Failed to get token");
        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/vendor-items/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch vendor item data");

        const data = await res.json();
        setItemData({
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          isActive: data.isActive,
        });
      } catch (err) {
        console.error("❌ Failed to load vendor item:", err);
        toast.error("Failed to load vendor item data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  // === Update vendor item ===
  const handleUpdateVendor = async (data: VendorItemFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const res = await fetch(`${apiUrl}/vendor-items/${id}`, {
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

      toast.success("Vendor Item updated successfully!");
      router.push("/super-admin/vendor-items");
      router.refresh();
    } catch (err) {
      console.error("❌ Failed to update vendor item:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update vendor item"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 ">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Vendor Item
      </h2>

      <VendorItemForm
        initialData={itemData}
        onSubmit={handleUpdateVendor}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default EditItemVendor;
