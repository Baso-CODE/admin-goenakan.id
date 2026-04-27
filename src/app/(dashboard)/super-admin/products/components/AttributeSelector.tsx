"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/useApi";
import { GripVertical, ListChecks, Loader2, Plus, Trash2 } from "lucide-react"; // Menambahkan ikon baru
import { useEffect, useState } from "react";
import { toast } from "sonner";

// --- TIPE DATA ---

type AttributeFromServer = {
  id: string;
  name: string;
  values: { id: string; value: string }[];
};

type SelectedAttributeRow = {
  attributeId: string;
  valueIds: string[];
};

// --- KOMPONEN UTAMA ---

export function AttributeSelector({
  value,
  onChange,
}: {
  value?: SelectedAttributeRow[];
  onChange: (v: SelectedAttributeRow[], full: AttributeFromServer[]) => void;
}) {
  const { fetchApi, status } = useApi(); // ✨ Ambil fetchApi dan status

  const [available, setAvailable] = useState<AttributeFromServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<SelectedAttributeRow[]>(value ?? []);

  // Sync: Ambil data dari parent saat pertama kali atau saat 'value' berubah
  useEffect(() => {
    if (value) {
      setLocal(value);
    }
  }, [value]);

  // Sync: Beri tahu parent (FormUpdateAttributes) setiap kali 'local' atau 'available' berubah
  useEffect(() => {
    onChange(local, available);
  }, [local, available]);

  // Load attributes from server
  useEffect(() => {
    const fetchAttributes = async () => {
      // 🛑 Jangan jalan jika sesi belum siap
      if (status === "loading" || status === "unauthenticated") return;

      setLoading(true);
      try {
        // ✨ Gunakan fetchApi (Otomatis handle Base URL dan Token)
        const res = await fetchApi("/product-attributes/list");

        if (!res.ok) throw new Error();

        const data = await res.json();
        setAvailable(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load attributes.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, [status, fetchApi]); // Tambahkan dependensi lengkap

  // --- LOGIC HANDLERS ---

  const add = () => {
    const lastRow = local[local.length - 1];
    if (lastRow && !lastRow.attributeId) {
      toast.warning("Please select an attribute for the previous row first.");
      return;
    }
    setLocal((prev) => [...prev, { attributeId: "", valueIds: [] }]);
  };

  const remove = (i: number) =>
    setLocal((prev) => prev.filter((_, idx) => idx !== i));

  const setAttributeId = (index: number, id: string) =>
    setLocal((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        // Cek duplikasi
        const isDuplicate = prev.some(
          (r, j) => j !== index && r.attributeId === id,
        );
        if (isDuplicate) {
          toast.error("This attribute has already been selected.");
          return row; // Kembalikan baris yang lama
        }

        // Reset valueIds saat attribute berubah
        return { ...row, attributeId: id, valueIds: [] };
      }),
    );

  const toggleValue = (index: number, valueId: string) =>
    setLocal((prev) =>
      prev.map((row, i) =>
        i !== index
          ? row
          : {
              ...row,
              valueIds: row.valueIds.includes(valueId)
                ? row.valueIds.filter((v) => v !== valueId)
                : [...row.valueIds, valueId],
            },
      ),
    );

  // Filter available attributes that are already selected in other rows
  const getUnselectedAttributes = (currentId: string) => {
    const selectedIds = local
      .filter((row) => row.attributeId !== currentId)
      .map((row) => row.attributeId);
    return available.filter((attr) => !selectedIds.includes(attr.id));
  };

  // --- RENDER ---

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <h4 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <ListChecks className="h-5 w-5 text-indigo-600" />
          Product Attributes
        </h4>
        <Button onClick={add} variant="default" size="sm" className="space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Attribute Row</span>
        </Button>
      </div>

      {loading && (
        <div className="flex items-center space-x-2 text-sm text-indigo-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading available attributes...</span>
        </div>
      )}

      {/* List Attributes yang Dipilih */}
      <div className="space-y-4">
        {local.map((row, idx) => {
          const attr = available.find((a) => a.id === row.attributeId);
          const unselectedAttributes = getUnselectedAttributes(row.attributeId);

          return (
            <Card
              key={idx}
              className="border-2 shadow-sm hover:border-indigo-300 transition-colors">
              <CardContent className="p-4 space-y-4">
                {/* BAGIAN ATAS: SELECTOR & DELETE */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 w-full">
                    {/* Handle Bar (Placeholder jika drag-and-drop diimplementasikan) */}
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-grab hidden sm:block" />

                    <div className="flex-1">
                      <Label className="text-sm font-semibold">
                        Attribute #{idx + 1}
                      </Label>
                      <Select
                        value={row.attributeId}
                        onValueChange={(val) => setAttributeId(idx, val)}
                        disabled={loading}>
                        <SelectTrigger className="mt-1 w-full font-medium">
                          <SelectValue placeholder="Pilih jenis attribute (e.g., Warna, Ukuran)..." />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Tampilkan attribute yang sudah dipilih + yang belum dipilih lainnya */}
                          {unselectedAttributes.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name} ({a.values.length} values)
                            </SelectItem>
                          ))}
                          {attr && (
                            <SelectItem key={attr.id} value={attr.id}>
                              {attr.name} (Currently Selected)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tombol Hapus */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="mt-6 shrink-0"
                    onClick={() => remove(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* BAGIAN BAWAH: VALUES CHECKBOXES */}
                <div className="pt-3 border-t">
                  <Label className="text-sm font-semibold mb-2 block">
                    Available Values
                  </Label>

                  {attr ? (
                    attr.values.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-3 gap-x-4">
                        {attr.values.map((val) => (
                          <label
                            key={val.id}
                            className="flex items-center space-x-2 text-sm cursor-pointer border p-2 rounded-md transition-colors hover:bg-gray-100"
                            style={{
                              backgroundColor: row.valueIds.includes(val.id)
                                ? "#eef2ff"
                                : "transparent", // Warna latar belakang jika dipilih
                              borderColor: row.valueIds.includes(val.id)
                                ? "#4f46e5"
                                : "#e5e7eb", // Warna border jika dipilih
                            }}>
                            <Checkbox
                              id={`attr-val-${val.id}`}
                              checked={row.valueIds.includes(val.id)}
                              onCheckedChange={() => toggleValue(idx, val.id)}
                              className="h-4 w-4"
                            />
                            <span className="truncate">{val.value}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-orange-500 italic">
                        ⚠️ Attribute "{attr.name}" has no values defined.
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Silakan pilih attribute di atas untuk melihat nilai
                      (values) yang tersedia.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {local.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-4 border rounded-lg italic">
            No attributes selected yet. Click "Add Attribute Row" to start.
          </p>
        )}
      </div>

      {/* <div className="pt-4 border-t flex justify-end">
        <Button onClick={add} variant="default" size="sm" className="space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Another Attribute Row</span>
        </Button>
      </div> */}
    </div>
  );
}
