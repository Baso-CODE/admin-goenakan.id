"use client";

import React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import PurchaseChannelForm, {
  PurchaseChannelFormValues,
} from "../components/formPurchaseChannel";

const AddPurchaseChannel = () => {
  const router = useRouter();

  const handleAddPurchaseChannel = async (data: PurchaseChannelFormValues) => {
    try {
      // === GET TOKEN ===
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      if (!token) throw new Error("No token found");

      // === POST TO BACKEND ===
      const res = await fetch("http://localhost:8000/purchase-channels", {
        method: "POST",
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

      toast.success("Purchase Channel created successfully!");
      router.push("/super-admin/purchase-channel");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create purchase channel"
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
