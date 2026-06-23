# Product Variant Price Calculation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically calculate the default price of each generated variant as `basePrice + sum of modifiers of selected attributes` while maintaining manual overrides.

**Architecture:** Update the `handleGenerateVariants` function in the React hook `useProductFormV2.ts` to sum the price modifiers from `attributeSelections` matching the value IDs of each variant combination and apply them to the variant metadata.

**Tech Stack:** React, Next.js, React Hook Form, TypeScript.

## Global Constraints
- Do not introduce type compilation errors. Run `bun run tsc --noEmit` to verify type safety.
- Follow existing formatting and syntax rules in the hook file.

---

### Task 1: Update Variant Price Calculation logic in useProductFormV2.ts

**Files:**
- Modify: `src/hooks/useProductFormV2.ts:262-298`

**Interfaces:**
- Consumes: `attributeSelections` state (specifically `priceModifiers`), `form` basePrice value.
- Produces: Updated variant metadata schema populated with dynamic default prices.

- [ ] **Step 1: Modify handleGenerateVariants in useProductFormV2.ts**

  Locate the mapping logic for `newVariantMetas` inside `handleGenerateVariants` and update it to sum matching `priceModifiers`:

  ```typescript
  // Replace:
  const currentBasePrice = Number(form.getValues("basePrice")) || 0;
  const newVariantMetas = comboObjects.map((_, idx) => ({
    variantIndex: idx,
    price: currentBasePrice,
    stock: 0,
    isFeatured: false,
    altText: "",
    description: "",
    priceTiers: [],
  }));

  // With:
  const currentBasePrice = Number(form.getValues("basePrice")) || 0;
  const newVariantMetas = comboObjects.map((comb, idx) => {
    // Sum modifiers for valueIds in this combo
    let modifierSum = 0;
    attributeSelections.forEach((selection) => {
      selection.valueIds.forEach((valId) => {
        if (comb.valueIds.includes(valId)) {
          const modVal = (selection as any).priceModifiers?.[valId];
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

- [ ] **Step 2: Run TypeScript compile verification**

  Run: `cd admin-goenakan.id && bun run tsc --noEmit`
  Expected: Command completes successfully with exit code 0 and no type errors.

- [ ] **Step 3: Commit changes**

  Run: `git add src/hooks/useProductFormV2.ts`
  Run: `git commit -m "feat(products): auto-calculate variant prices from base price and attribute modifiers"`
