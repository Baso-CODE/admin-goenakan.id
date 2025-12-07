"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type AttributeFromServer = {
  id: string;
  name: string;
  values: { id: string; value: string }[];
};

export function AttributeSelector({
  value,
  onChange,
}: {
  value?: { attributeId: string; valueIds: string[] }[];
  onChange: (
    v: { attributeId: string; valueIds: string[] }[],
    full: AttributeFromServer[]
  ) => void;
}) {
  const [available, setAvailable] = useState<AttributeFromServer[]>([]);
  const [loading, setLoading] = useState(false);

  const [local, setLocal] = useState<
    { attributeId: string; valueIds: string[] }[]
  >(value ?? []);

  // NEW: sync when value from parent changes (for prefill)
  useEffect(() => {
    if (value) {
      setLocal(value);
    }
  }, [value]);

  // Notify parent
  useEffect(() => {
    onChange(local, available);
  }, [local, available]);

  // Load attributes from server
  useEffect(() => {
    setLoading(true);

    const fetchAttributes = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        const { token } = await tokenRes.json();
        const res = await fetch(
          "http://localhost:8000/product-attributes/list",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAvailable(data);
      } catch {
        toast.error("Failed to load attributes.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, []);

  // Notify parent on change
  useEffect(() => {
    onChange(local, available); // <======== UPDATED
  }, [local, available]);

  const add = () =>
    setLocal((prev) => [...prev, { attributeId: "", valueIds: [] }]);

  const remove = (i: number) =>
    setLocal((prev) => prev.filter((_, idx) => idx !== i));

  const setAttributeId = (index: number, id: string) =>
    setLocal((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, attributeId: id, valueIds: [] } : row
      )
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
            }
      )
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Attributes</h4>
        <Button onClick={add} variant="outline" size="sm">
          + Add Attribute
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading attributes…</p>
      )}

      {local.map((row, idx) => {
        const attr = available.find((a) => a.id === row.attributeId);

        return (
          <Card key={idx} className="border shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-full mr-4">
                  <Label className="text-sm">Attribute</Label>
                  <Select
                    value={row.attributeId}
                    onValueChange={(val) => setAttributeId(idx, val)}
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Pilih attribute..." />
                    </SelectTrigger>
                    <SelectContent>
                      {available.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Values */}
              {attr ? (
                <div className="grid grid-cols-2 gap-3">
                  {attr.values.map((val) => (
                    <label
                      key={val.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={row.valueIds.includes(val.id)}
                        onCheckedChange={() => toggleValue(idx, val.id)}
                      />
                      {val.value}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pilih attribute untuk menampilkan values.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
