# Design Spec: Auto-Calculated Variant Prices from Attribute Modifiers

This specification outlines the implementation of automated client-side variant price calculation based on base price and attribute value price modifiers (Option A: Auto-Calculated Base with Manual Override).

## Background & Goals
Currently, when creating or editing custom products in the admin panel, the admin can define product attributes (e.g. Size, Material) and assign a price modifier (additional charge, e.g. `+50,000` for Metal) to specific attribute values.
However, when generating variants from these attributes, the system auto-fills the price of every generated variant to the base product price. This requires the admin to manually calculate and input the price for each combination, which is error-prone and time-consuming.

The goal is to automatically calculate the default price of each generated variant as:
$$\text{Variant Price} = \text{Product Base Price} + \sum \text{Price Modifiers of Selected Values}$$

The admin still retains the ability to manually override these calculated prices on a per-variant basis before saving.

## Data Flow & Architecture

1. **Database Schema Support:**
   - Already fully supported. `ProductAttributeValue` contains `priceModifier: Float? @default(0)`, and `ProductVariant` contains `price: Decimal?`.
2. **Backend API Support:**
   - Already fully supported. The endpoint for creating/updating products parses custom variant prices from `variantImagesMetadata` and attribute-level modifiers.
3. **Frontend Changes (`src/hooks/useProductFormV2.ts`):**
   - Update `handleGenerateVariants` to sum the price modifiers from `attributeSelections` for the matching value IDs of each combination.
   - Pre-populate `price: calculatedPrice` in `variantMetas`.

## Detailed Implementation Plan
- Update `handleGenerateVariants`:
  - Fetch `basePrice` using `form.getValues("basePrice")`.
  - For each variant combo (`comb.valueIds`):
    - Sum up any modifiers matching the value IDs.
    - Set the calculated price as the default variant price.

- Add Reactive Sync `useEffect` in `useProductFormV2.ts`:
  - Listen to `combinations`, `attributeSelections`, and `form.watch("basePrice")`.
  - Recalculate variant prices dynamically for all items that do not have `isPriceOverridden` set to true.
  
- Update `handleUpdateVariantMeta`:
  - When the modified field is `price`, set `isPriceOverridden = true` on the modified variant metadata object.

