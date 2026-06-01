"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApi } from "@/hooks/useApi";
import { useState } from "react";
import { toast } from "sonner";
import ProductCategoryForm from "./formCategoryProduct";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCategory: any) => void;
}

export default function CreateCategoryModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCategoryModalProps) {
  const { fetchApi, status } = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategoryProduct = async (formData: FormData) => {
    if (status !== "authenticated") return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi("/product-categories", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create category");
      }

      const responseData = await res.json();

      toast.success("Product Category created successfully!");

      onSuccess(responseData.data || responseData);
      onClose();
    } catch (err: any) {
      console.error("❌ Create Category Error:", err);
      toast.error(err.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl uppercase tracking-tight">
            Add New Product Category
          </DialogTitle>
        </DialogHeader>

        <ProductCategoryForm
          onSubmit={handleAddCategoryProduct}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
