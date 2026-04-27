"use client";

import { useApi } from "@/hooks/useApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PurchaseChannelForm, {
  PurchaseChannelFormValues,
} from "../../components/formPurchaseChannel";

const EditPurchaseChannel = () => {
  const { fetchApi, status } = useApi();

  const { slug } = useParams();
  const router = useRouter();

  const [purchaseChannelData, setPurchaseChannelData] = useState<
    PurchaseChannelFormValues | undefined
  >(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // FETCH DATA
  // ============================
  useEffect(() => {
    const fetchData = async () => {
      if (!slug || status !== "authenticated") return;

      try {
        setIsLoading(true);

        const res = await fetchApi(`/purchase-channels/${slug}`);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.message || "Failed to fetch purchase channel data",
          );
        }

        const data = await res.json();

        setPurchaseChannelData({
          name: data.name,
          isActive: data.isActive,
        });
      } catch (err: any) {
        console.error("❌ Failed to load purchase channel:", err);
        toast.error(err.message || "Failed to load purchase channel data.");
        setPurchaseChannelData(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug, status, fetchApi]); // Tambahkan dependensi lengkap
  // ============================
  // UPDATE DATA
  // ============================
  const handleUpdatePurchaseChannel = async (
    formValues: PurchaseChannelFormValues,
  ) => {
    if (status !== "authenticated") return;

    try {
      setIsSubmitting(true);

      const res = await fetchApi(`/purchase-channels/${slug}`, {
        method: "PATCH",
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update purchase channel");
      }

      toast.success("Purchase channel updated successfully!");
      router.push("/super-admin/purchase-channel");
      router.refresh();
    } catch (err) {
      console.error("❌ Update Error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update purchase channel",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Purchase Channel
      </h2>

      <PurchaseChannelForm
        initialData={purchaseChannelData}
        onSubmit={handleUpdatePurchaseChannel}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default EditPurchaseChannel;
