"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { VendorFormValues } from "../components/VendorForm";

type VendorCategory = {
  id: string;
  name: string;
  type: string;
};

type VendorItem = {
  id: string;
  name: string;
  categoryId: string;
};

interface UseVendorFormFilterProps {
  form: UseFormReturn<VendorFormValues>;
  vendorCategories: VendorCategory[];
  vendorItems: VendorItem[];
}

export function useVendorFormFilter({
  form,
  vendorCategories,
  vendorItems,
}: UseVendorFormFilterProps) {
  const [filteredCategories, setFilteredCategories] = useState<
    VendorCategory[]
  >([]);
  const [filteredItems, setFilteredItems] = useState<VendorItem[]>([]);

  useEffect(() => {
    const selectedType = form.watch("type");

    if (!selectedType) {
      setFilteredCategories([]);
      return;
    }

    const filtered = vendorCategories.filter(
      (cat) => cat.type === selectedType
    );
    setFilteredCategories(filtered);
  }, [form.watch("type"), vendorCategories]);

  useEffect(() => {
    const selectedCategory = form.watch("categoryId");

    if (!selectedCategory) {
      setFilteredItems([]);
      return;
    }

    const filtered = vendorItems.filter(
      (item) => item.categoryId === selectedCategory
    );
    setFilteredItems(filtered);

    const currentItemIds = form.getValues("itemIds") ?? [];
    const stillValidItemIds = currentItemIds.filter((id) =>
      vendorItems.some((item) => item.id === id)
    );

    if (stillValidItemIds.length !== currentItemIds.length) {
      form.setValue("itemIds", stillValidItemIds);
    }
  }, [form.watch("categoryId"), vendorItems]);

  return { filteredCategories, filteredItems };
}
