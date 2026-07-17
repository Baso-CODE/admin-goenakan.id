# Product Variant Price Calculation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically calculate the default price of each generated variant as `basePrice + sum of modifiers of selected attributes` while maintaining manual overrides.

**Architecture:** Update the state definitions, the `handleGenerateVariants` function, and add a reactive `useEffect` inside `useProductFormV2.ts` to dynamically calculate and update variant prices while checking the `isPriceOverridden` metadata flag.

**Tech Stack:** React, Next.js, React Hook Form, TypeScript.

## Global Constraints
- Do not introduce type compilation errors. Run `bun run tsc --noEmit` to verify type safety.
- Follow existing formatting and syntax rules in the hook file.

---

### Task 1: Update State Definition & Price Calculation in useProductFormV2.ts

**Files:**
- Modify: `src/hooks/useProductFormV2.ts`

- [ ] **Step 1: Update attributeSelections State Type Definition**
  Update the hook state `attributeSelections` to include the `priceModifiers` record type definition:
  ```typescript
  const [attributeSelections, setAttributeSelections] = useState<
    { attributeId: string; valueIds: string[]; priceModifiers?: Record<string, number> }[]
  >([]);
  ```

- [ ] **Step 2: Update handleGenerateVariants pricing calculation**
  Update `handleGenerateVariants` to sum the modifiers clean of `as any` casting:
  ```typescript
  const currentBasePrice = Number(form.getValues("basePrice")) || 0;
  const newVariantMetas = comboObjects.map((comb, idx) => {
    let modifierSum = 0;
    attributeSelections.forEach((selection) => {
      selection.valueIds.forEach((valId) => {
        if (comb.valueIds.includes(valId)) {
          const modVal = selection.priceModifiers?.[valId];
          if (modVal !== undefined) {
            modifierSum += Number(modVal) || 0;
          }
        }
      });
    });

    return {
      variantIndex: idx,
      price: currentBasePrice + modifierSum,
      stock: 0,
      isFeatured: false,
      altText: "",
      description: "",
      priceTiers: [],
    };
  });
  ```

- [ ] **Step 3: Update handleUpdateVariantMeta to track manual overrides**
  Update `handleUpdateVariantMeta` to mark `isPriceOverridden: true` if the modified field is `"price"`.
  ```typescript
  handleUpdateVariantMeta: (idx: number, field: string, val: any) => {
    const updated = variantMetas.map((m) => {
      if (m.variantIndex === idx) {
        const isPriceEdit = field === "price";
        return {
          ...m,
          [field]: val,
          ...(isPriceEdit ? { isPriceOverridden: true } : {}),
        };
      }
      return m;
    });
    setVariantMetas(updated);
    form.setValue("variantImagesMetadata", updated);
  },
  ```

- [ ] **Step 4: Add reactive useEffect for live price sync**
  Watch `basePrice`, `attributeSelections`, and `combinations`. Recalculate variant prices dynamically for all items that do not have `isPriceOverridden` set to true.
  ```typescript
  const basePrice = form.watch("basePrice");

  useEffect(() => {
    if (!variantMetas.length || !combinations.length) return;
    const currentBasePrice = Number(basePrice) || 0;
    let isChanged = false;

    const updated = variantMetas.map((m) => {
      const comb = combinations[m.variantIndex];
      if (!comb || m.isPriceOverridden) return m;

      let modifierSum = 0;
      attributeSelections.forEach((selection) => {
        selection.valueIds.forEach((valId) => {
          if (comb.valueIds.includes(valId)) {
            const modVal = selection.priceModifiers?.[valId];
            if (modVal !== undefined) {
              modifierSum += Number(modVal) || 0;
            }
          }
        });
      });

      const newPrice = currentBasePrice + modifierSum;
      if (m.price !== newPrice) {
        isChanged = true;
        return { ...m, price: newPrice };
      }
      return m;
    });

    if (isChanged) {
      setVariantMetas(updated);
      form.setValue("variantImagesMetadata", updated);
    }
  }, [basePrice, attributeSelections, combinations, variantMetas, form]);
  ```

### Task 2: Verify & Compile Verification

- [ ] **Step 1: Run TypeScript compile verification**
  Run: `cd admin-goenakan.id && bun run tsc --noEmit`
  Expected: Command completes successfully with exit code 0 and no type errors.

- [ ] **Step 2: Commit changes**
  Run: `git add src/hooks/useProductFormV2.ts`
  Run: `git commit -m "feat(products): reactive variant price auto-calculation with manual override"`
