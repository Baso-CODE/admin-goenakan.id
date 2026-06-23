"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AttributeSelector } from "../AttributeSelector";
import { Button } from "@/components/ui/button";

export default function FormUpdateAttributes({
  initialData,
  isSubmitting,
  onSubmit,
  onAttributesChange,
}: {
  initialData: any;
  isSubmitting: boolean;
  onSubmit: (payload: any) => Promise<void>;
  onAttributesChange: (
    selections: { attributeId: string; valueIds: string[]; priceModifiers?: Record<string, number> }[],
    fullList: any[]
  ) => void;
}) {
  const [attributeSelections, setAttributeSelections] = useState<
    { attributeId: string; valueIds: string[]; priceModifiers?: Record<string, number> }[]
  >([]);

  const [attributesFullList, setAttributesFullList] = useState<any[]>([]);

  // Prefill dari initialData.attributeValues
  useEffect(() => {
    if (!initialData || !initialData.attributeValues) return;

    const grouped: Record<string, string[]> = {};
    const modifiers: Record<string, number> = {};

    initialData.attributeValues.forEach((item: any) => {
      const attrId = item.attributeValue?.attribute?.id;
      const valId = item.attributeValue?.id;

      if (!attrId || !valId) return; // skip data rusak

      if (!grouped[attrId]) grouped[attrId] = [];
      grouped[attrId].push(valId);
      modifiers[valId] = item.priceModifier || 0;
    });

    const variantGeneratingAttrIds = new Set<string>();
    initialData.productVariants?.forEach((variant: any) => {
      variant.attributeValues?.forEach((av: any) => {
        const attrId = av.attributeValue?.attributeId || av.attributeValue?.attribute?.id;
        if (attrId) {
          variantGeneratingAttrIds.add(attrId);
        }
      });
    });

    const mapped = Object.entries(grouped).map(([attributeId, valueIds]) => {
      const rowModifiers: Record<string, number> = {};
      valueIds.forEach((id) => {
        rowModifiers[id] = modifiers[id] || 0;
      });

      const isVariantGenerator = initialData.productVariants?.length > 0
        ? variantGeneratingAttrIds.has(attributeId)
        : true;

      return {
        attributeId,
        valueIds,
        priceModifiers: rowModifiers,
        isVariantGenerator,
      };
    });

    setAttributeSelections(mapped);
  }, [initialData]);

  const handleSave = async () => {
    try {
      // 1. BUAT ARRAY ID NILAI ATRIBUT YANG DATAR
      const allAttributeValueIds = attributeSelections.flatMap(
        (attr) => attr.valueIds
      );

      const allModifiers: Record<string, number> = {};
      attributeSelections.forEach((attr) => {
        if (attr.priceModifiers) {
          Object.entries(attr.priceModifiers).forEach(([valId, mod]) => {
            allModifiers[valId] = Number(mod);
          });
        }
      });

      // 2. Kirim payload yang benar sesuai dengan DTO Backend
      const payload = {
        attributeValueIds: allAttributeValueIds,
        priceModifiers: allModifiers,
      };

      await onSubmit(payload);
      // Setelah berhasil update, Anda mungkin ingin me-refresh productData
      // di komponen induk (EditProductPage) untuk menampilkan perubahan,
      // meskipun ini tidak wajib jika hanya mengubah atribut yang tidak langsung memengaruhi tampilan utama.
    } catch (err) {
      console.error(err);
      // toast.error sudah ditangani di komponen induk, tapi bisa dipertahankan di sini
      toast.error("Failed to update attributes");
    }
  };

  useEffect(() => {
    onAttributesChange(attributeSelections, attributesFullList);
  }, [attributeSelections, attributesFullList]);

  return (
    <div className="border rounded p-4 space-y-4">
      <h3 className="text-lg font-semibold">Product Attributes</h3>

      <AttributeSelector
        value={attributeSelections}
        onChange={(attrs, full) => {
          setAttributeSelections(attrs);
          setAttributesFullList(full);
          onAttributesChange(attrs, full);
        }}
      />

      <Button disabled={isSubmitting} onClick={handleSave} className="">
        Save Attributes
      </Button>
    </div>
  );
}
