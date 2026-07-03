export const cmykToRgb = (c: number, m: number, y: number, k: number) => {
  const r = Math.round(255 * (1 - c / 100) * (1 - k / 100));
  const g = Math.round(255 * (1 - m / 100) * (1 - k / 100));
  const b = Math.round(255 * (1 - y / 100) * (1 - k / 100));
  return { r, g, b };
};

export const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
};

export const cmykToHex = (c: number, m: number, y: number, k: number) => {
  const { r, g, b } = cmykToRgb(c, m, y, k);
  return rgbToHex(r, g, b);
};

export const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return { r, g, b };
};

export const rgbToCmyk = (r: number, g: number, b: number) => {
  let c = 1 - r / 255;
  let m = 1 - g / 255;
  let y = 1 - b / 255;
  let k = Math.min(c, m, y);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  c = Math.round(((c - k) / (1 - k)) * 100);
  m = Math.round(((m - k) / (1 - k)) * 100);
  y = Math.round(((y - k) / (1 - k)) * 100);
  k = Math.round(k * 100);

  return { c, m, y, k };
};

export const hexToCmyk = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToCmyk(r, g, b);
};

export const parseColorValue = (val: string) => {
  if (!val) return { name: "", hex: "#000000", cmyk: { c: 0, m: 0, y: 0, k: 100 } };
  const parts = val.split("|");
  if (parts.length === 3) {
    const name = parts[0];
    const hex = parts[1];
    const cmykMatch = parts[2].match(/cmyk\((\d+),(\d+),(\d+),(\d+)\)/);
    if (cmykMatch) {
      return {
        name,
        hex,
        cmyk: {
          c: parseInt(cmykMatch[1]),
          m: parseInt(cmykMatch[2]),
          y: parseInt(cmykMatch[3]),
          k: parseInt(cmykMatch[4]),
        }
      };
    }
  } else if (parts.length === 2) {
    const name = parts[0];
    const hex = parts[1];
    const cmyk = hexToCmyk(hex);
    return { name, hex, cmyk };
  } else if (val.startsWith("#")) {
    const cmyk = hexToCmyk(val);
    return { name: "", hex: val, cmyk };
  }
  return { name: val, hex: "#000000", cmyk: { c: 0, m: 0, y: 0, k: 100 } };
};
