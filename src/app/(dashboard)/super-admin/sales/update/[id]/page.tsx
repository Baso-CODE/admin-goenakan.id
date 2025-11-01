"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SalesForm, { SalesFormValues } from "../../components/FormSales";

export default function EditSalesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [salesData, setSalesData] = useState<SalesFormValues | undefined>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();

        const res = await fetch(`http://localhost:8000/sales/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch sales data");

        const data = await res.json();

        setSalesData({
          prefix: data.prefix,
          name: data.name,
          phone: data.phone,
          signatureUrl: data.signatureUrl || "",
          isActive: data.isActive,
          bankAccounts: data.bankAccounts || [],
        });
      } catch (err) {
        console.error("❌ Error fetching sales data:", err);
        toast.error("Failed to load sales data");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleUpdateSales = async (data: SalesFormValues) => {
    setIsSubmitting(true);
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const res = await fetch(`http://localhost:8000/sales/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          prefix: data.prefix,
          name: data.name,
          phone: data.phone,
          signatureUrl: data.signatureUrl || null,
          isActive: data.isActive,
          // bankAccounts tidak disertakan di sini
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update sales person");
      }

      toast.success("Sales person updated successfully!");
      // 9. Ganti rute navigasi
      router.push("/super-admin/sales");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update sales person"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full">
      <h2 className="text-xl font-semibold tracking-tight uppercase">
        Edit Sales Person
      </h2>
      <SalesForm
        initialData={salesData}
        onSubmit={handleUpdateSales}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
