"use client";

import { apiUrl } from "@/helper/apiurl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PurchaseChannelForm, {
  PurchaseChannelFormValues,
} from "../../components/formPurchaseChannel";

const EditPurchaseChannel = () => {
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
      try {
        setIsLoading(true);

        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Failed to get token");

        const { token } = await tokenRes.json();

        const res = await fetch(`${apiUrl}/purchase-channels/${slug}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch purchase channel data");

        const data = await res.json();

        setPurchaseChannelData({
          name: data.name,
          isActive: data.isActive,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load purchase channel data.");
        setPurchaseChannelData(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  // ============================
  // UPDATE DATA
  // ============================
  const handleUpdatePurchaseChannel = async (
    formValues: PurchaseChannelFormValues
  ) => {
    try {
      setIsSubmitting(true);

      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      const res = await fetch(`${apiUrl}/purchase-channels/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValues),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      toast.success("Purchase channel updated successfully!");

      router.push("/super-admin/purchase-channel");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update purchase channel"
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
