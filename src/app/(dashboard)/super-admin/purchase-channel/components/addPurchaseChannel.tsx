"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useApi } from "@/hooks/useApi";
import PurchaseChannelForm, {
  PurchaseChannelFormValues,
} from "../components/formPurchaseChannel";

const AddPurchaseChannel = () => {
  const { fetchApi, status } = useApi();

  const router = useRouter();

  const handleAddPurchaseChannel = async (data: PurchaseChannelFormValues) => {
    if (status !== "authenticated") return;

    try {
      const res = await fetchApi("/purchase-channels", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        // Parsing error secara aman
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create purchase channel");
      }

      toast.success("Purchase Channel created successfully!");
      router.push("/super-admin/purchase-channel");
      router.refresh();
    } catch (err: any) {
      console.error("❌ Create Purchase Channel Error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to create purchase channel",
      );
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Add Purchase Channel
      </h2>

      <PurchaseChannelForm onSubmit={handleAddPurchaseChannel} />
    </div>
  );
};

export default AddPurchaseChannel;
