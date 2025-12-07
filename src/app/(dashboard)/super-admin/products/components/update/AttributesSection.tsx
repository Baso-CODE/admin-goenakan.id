"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AttributeSelector } from "../AttributeSelector";

export default function FormUpdateAttributes({
  initialData,
  isSubmitting,
  onSubmit,
}: {
  initialData: any;
  isSubmitting: boolean;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [attributeSelections, setAttributeSelections] = useState<
    { attributeId: string; valueIds: string[] }[]
  >([]);

  const [attributesFullList, setAttributesFullList] = useState<any[]>([]);

  // Prefill dari initialData.attributeValues
  useEffect(() => {
    if (!initialData || !initialData.attributeValues) return;

    const grouped: Record<string, string[]> = {};

    initialData.attributeValues.forEach((item: any) => {
      const attrId = item.attributeValue?.attribute?.id;
      const valId = item.attributeValue?.id;

      if (!attrId || !valId) return; // skip data rusak

      if (!grouped[attrId]) grouped[attrId] = [];
      grouped[attrId].push(valId);
    });

    const mapped = Object.entries(grouped).map(([attributeId, valueIds]) => ({
      attributeId,
      valueIds,
    }));

    setAttributeSelections(mapped);
  }, [initialData]);

  const handleSave = async () => {
    try {
      const payload = {
        attributes: attributeSelections,
      };

      await onSubmit(payload);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update attributes");
    }
  };

  return (
    <div className="border rounded p-4 space-y-4">
      <h3 className="text-lg font-semibold">Product Attributes</h3>

      <AttributeSelector
        value={attributeSelections}
        onChange={(attrs, full) => {
          setAttributeSelections(attrs);
          setAttributesFullList(full);
        }}
      />

      <button
        disabled={isSubmitting}
        onClick={handleSave}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Save Attributes
      </button>
    </div>
  );
}
