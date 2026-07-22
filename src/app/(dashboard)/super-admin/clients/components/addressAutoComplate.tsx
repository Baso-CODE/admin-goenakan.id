"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface PhotonFeature {
  properties: {
    name?: string;
    street?: string;
    city?: string;
    country?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface Props {
  onSelect: (value: string) => void;
  label?: string;
}

export default function FreeGlobalAddressAutocomplete({
  onSelect,
  label = "Full Address",
}: Props) {
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);

  // 👉 Get quick suggestions (Photon)
  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) return setSuggestions([]);

    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}`,
    );
    const data = await res.json();

    setSuggestions(data.features || []);
  };

  // 👉 Get FULL ADDRESS from Nominatim (lat/lon)
  const fetchFullAddress = async (lat: number, lon: number) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
    );

    const json = await res.json();
    return json.display_name || "";
  };

  // 👉 What text to display in suggestions
  const getLabel = (item: PhotonFeature) => {
    const p = item.properties;

    return (
      p.name ||
      `${p.street ?? ""} ${p.city ?? ""} ${p.country ?? ""}`.trim() ||
      "Unknown"
    );
  };

  return (
    <div className="space-y-2 relative">
      <Label>{label}</Label>

      <Input
        placeholder="Search global address…"
        onChange={(e) => fetchSuggestions(e.target.value)}
        className="rounded-xl h-11"
      />

      {suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item, idx) => {
            const label = getLabel(item);
            const [lon, lat] = item.geometry.coordinates;

            return (
              <button
                key={idx}
                onClick={async () => {
                  // Get full address from Nominatim
                  const full = await fetchFullAddress(lat, lon);
                  onSelect(full);
                  setSuggestions([]);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
