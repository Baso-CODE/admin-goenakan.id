/**
 * Helper to determine whether a ProductImage is classified as a Mockup Template image
 * (as opposed to a main product gallery/showcase image).
 *
 * An image is a Mockup Template if ANY of the following are true:
 * 1. altText indicates a mockup (e.g. "Mockup Image" or contains "mockup" case-insensitively).
 * 2. It has an assigned mockupSideName (e.g. "Tampak Depan", "Tampak Belakang").
 * 3. It is linked to an attributeValueId, printPositionValueId, or printSideValueId.
 * 4. It has configured mockup placement areas (mockupAreas.length > 0).
 * 5. It has a dynamic color mask (colorMaskUrl or colorMaskPublicId).
 */
export const isMockupImage = (img: any): boolean => {
  if (!img) return false;

  // 1. altText check (case-insensitive substring match)
  if (typeof img.altText === "string") {
    const lower = img.altText.toLowerCase().trim();
    if (lower === "mockup image" || lower.includes("mockup")) {
      return true;
    }
  }

  // 2. Mockup side name
  if (img.mockupSideName && String(img.mockupSideName).trim() !== "") {
    return true;
  }

  // 3. Variant or custom attributes relations
  if (img.attributeValueId || img.printPositionValueId || img.printSideValueId) {
    return true;
  }

  // 4. Mockup placement areas configured
  if (Array.isArray(img.mockupAreas) && img.mockupAreas.length > 0) {
    return true;
  }

  // 5. Dynamic color mask presence
  if (img.colorMaskUrl || img.colorMaskPublicId) {
    return true;
  }

  return false;
};
