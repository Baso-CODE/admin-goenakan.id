"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApi } from "@/hooks/useApi";
import { countries } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const WILAYAH_BASE_PATH = "/wilayah";
const GLOBAL_API_URL = "https://countriesnow.space/api/v0.1";

export interface AddressValue {
  country: string;
  province: string;
  city: string;
  district: string;
  subDistrict: string;
  postalCode: string;
}

interface AddressFieldProps {
  value: AddressValue;
  onChange: (updated: Partial<AddressValue>) => void;
}

function RegionCombobox({
  label,
  value,
  list,
  placeholder,
  disabled,
  loading,
  onChange,
}: {
  label: string;
  value: string;
  list: any[];
  placeholder: string;
  disabled: boolean;
  loading?: boolean;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={cn(
              "w-full justify-between h-10 font-normal",
              !value && "text-muted-foreground",
            )}>
            <span className="truncate">
              {loading ? "Loading..." : value || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start">
          <Command>
            <CommandInput placeholder={`Cari ${label.toLowerCase()}...`} />
            <CommandList>
              {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading data...
                </div>
              ) : (
                <CommandEmpty>Tidak ditemukan</CommandEmpty>
              )}
              <CommandGroup>
                {Array.isArray(list) &&
                  list.map((item, idx) => (
                    <CommandItem
                      key={item.code || idx}
                      value={item.name}
                      onSelect={() => {
                        onChange(item.name);
                        setOpen(false);
                      }}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {item.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function AddressField({ value, onChange }: AddressFieldProps) {
  const { fetchApi } = useApi();
  const [openCountry, setOpenCountry] = useState(false);
  const [loading, setLoading] = useState(false);

  // States untuk Indonesia
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subDistricts, setSubDistricts] = useState<any[]>([]);

  // States untuk Global
  const [globalStates, setGlobalStates] = useState<any[]>([]);
  const [globalCities, setGlobalCities] = useState<any[]>([]);

  // Cache lokal untuk menyimpan data yang sudah pernah di-fetch agar tidak fetch ulang
  const cacheRef = useRef<{ [key: string]: any[] }>({});

  const isIndonesia = value.country === "Indonesia";

  // 1. Fetch Provinsi Indonesia (Hanya 1 kali)
  useEffect(() => {
    if (!isIndonesia || provinces.length > 0) return;
    const fetchProvinces = async () => {
      try {
        setLoading(true);
        const res = await fetchApi(`${WILAYAH_BASE_PATH}/provinces`);
        const data = await res.json();
        if (Array.isArray(data.data)) setProvinces(data.data);
      } catch (err) {
        console.error("Error fetching Indo provinces:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProvinces();
  }, [fetchApi, isIndonesia, provinces.length]);

  // 2. Fetch Kota Berdasarkan Provinsi
  useEffect(() => {
    if (!isIndonesia || !value.province) return;
    const prov = provinces.find((p: any) => p.name === value.province);
    if (!prov) return;

    // Jika cache untuk provinsi ini sudah ada, gunakan cache langsung tanpa fetch API
    if (cacheRef.current[`city_${prov.code}`]) {
      setCities(cacheRef.current[`city_${prov.code}`]);
      return;
    }

    const fetchCities = async () => {
      try {
        setLoading(true);
        const res = await fetchApi(
          `${WILAYAH_BASE_PATH}/regencies/${prov.code}`,
        );
        const data = await res.json();
        if (Array.isArray(data.data)) {
          setCities(data.data);
          cacheRef.current[`city_${prov.code}`] = data.data; // Simpan ke cache
        }
      } catch (err) {
        console.error("Error fetching Indo cities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, [value.province, isIndonesia, provinces]);

  // 3. Fetch Kecamatan Berdasarkan Kota
  useEffect(() => {
    if (!isIndonesia || !value.city) return;
    const c = cities.find((p: any) => p.name === value.city);
    if (!c) return;

    if (cacheRef.current[`district_${c.code}`]) {
      setDistricts(cacheRef.current[`district_${c.code}`]);
      return;
    }

    const fetchDistricts = async () => {
      try {
        setLoading(true);
        const res = await fetchApi(`${WILAYAH_BASE_PATH}/districts/${c.code}`);
        const data = await res.json();
        if (Array.isArray(data.data)) {
          setDistricts(data.data);
          cacheRef.current[`district_${c.code}`] = data.data;
        }
      } catch (err) {
        console.error("Error fetching Indo districts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDistricts();
  }, [value.city, isIndonesia, cities]);

  // 4. Fetch Kelurahan Berdasarkan Kecamatan
  useEffect(() => {
    if (!isIndonesia || !value.district) return;
    const dist = districts.find((p: any) => p.name === value.district);
    if (!dist) return;

    if (cacheRef.current[`village_${dist.code}`]) {
      setSubDistricts(cacheRef.current[`village_${dist.code}`]);
      return;
    }

    const fetchSubDistricts = async () => {
      try {
        setLoading(true);
        const res = await fetchApi(
          `${WILAYAH_BASE_PATH}/villages/${dist.code}`,
        );
        const data = await res.json();
        if (Array.isArray(data.data)) {
          setSubDistricts(data.data);
          cacheRef.current[`village_${dist.code}`] = data.data;
        }
      } catch (err) {
        console.error("Error fetching Indo villages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubDistricts();
  }, [value.district, isIndonesia, districts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* COUNTRY */}
      <div className="space-y-2 flex flex-col">
        <Label>Negara</Label>
        <Popover open={openCountry} onOpenChange={setOpenCountry}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between pl-3 font-normal",
                !value.country && "text-muted-foreground",
              )}>
              {value.country ? (
                <span className="flex items-center gap-2 truncate">
                  <span>
                    {countries.find((c) => c.name === value.country)?.flag}
                  </span>
                  {value.country}
                </span>
              ) : (
                "Pilih Negara"
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start">
            <Command>
              <CommandInput placeholder="Cari negara..." />
              <CommandList>
                <CommandEmpty>Negara tidak ditemukan.</CommandEmpty>
                <CommandGroup>
                  {countries.map((c) => (
                    <CommandItem
                      key={c.code}
                      value={c.name}
                      onSelect={() => {
                        onChange({
                          country: c.name,
                          province: "",
                          city: "",
                          district: "",
                          subDistrict: "",
                          postalCode: "",
                        });
                        setOpenCountry(false);
                      }}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.country === c.name
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span>
                        {c.flag} {c.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* PROVINCE / STATE */}
      {isIndonesia || globalStates.length > 0 ? (
        <RegionCombobox
          label="Provinsi / State"
          placeholder="Pilih Provinsi"
          list={isIndonesia ? provinces : globalStates}
          value={value.province}
          disabled={!value.country}
          loading={loading && provinces.length === 0}
          onChange={(val) =>
            onChange({ province: val, city: "", district: "", subDistrict: "" })
          }
        />
      ) : (
        <div className="space-y-2">
          <Label>Provinsi / State</Label>
          <Input
            placeholder="Masukkan Provinsi"
            value={value.province}
            onChange={(e) => onChange({ province: e.target.value })}
            disabled={!value.country}
          />
        </div>
      )}

      {/* CITY */}
      {isIndonesia || globalCities.length > 0 ? (
        <RegionCombobox
          label="Kota / Kabupaten"
          placeholder="Pilih Kota"
          list={isIndonesia ? cities : globalCities}
          value={value.city}
          disabled={!value.province}
          loading={loading && cities.length === 0}
          onChange={(val) =>
            onChange({ city: val, district: "", subDistrict: "" })
          }
        />
      ) : (
        <div className="space-y-2">
          <Label>Kota / Kabupaten</Label>
          <Input
            placeholder="Masukkan Kota"
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
            disabled={!value.province}
          />
        </div>
      )}

      {/* DISTRICT */}
      {isIndonesia ? (
        <RegionCombobox
          label="Kecamatan"
          placeholder="Pilih Kecamatan"
          list={districts}
          value={value.district}
          disabled={!value.city}
          loading={loading && districts.length === 0}
          onChange={(val) => onChange({ district: val, subDistrict: "" })}
        />
      ) : (
        <div className="space-y-2">
          <Label>Kecamatan (Opsional)</Label>
          <Input
            placeholder="Masukkan Kecamatan"
            value={value.district}
            onChange={(e) => onChange({ district: e.target.value })}
            disabled={!value.city}
          />
        </div>
      )}

      {/* SUBDISTRICT */}
      {isIndonesia ? (
        <RegionCombobox
          label="Kelurahan"
          placeholder="Pilih Kelurahan"
          list={subDistricts}
          value={value.subDistrict}
          disabled={!value.district}
          loading={loading && subDistricts.length === 0}
          onChange={(val) => onChange({ subDistrict: val })}
        />
      ) : (
        <div className="space-y-2">
          <Label>Kelurahan (Opsional)</Label>
          <Input
            placeholder="Masukkan Kelurahan"
            value={value.subDistrict}
            onChange={(e) => onChange({ subDistrict: e.target.value })}
            disabled={!value.city}
          />
        </div>
      )}

      {/* POSTAL CODE */}
      <div className="space-y-2">
        <Label>Kode Pos</Label>
        <Input
          placeholder="Kode Pos"
          value={value.postalCode}
          onChange={(e) => onChange({ postalCode: e.target.value })}
        />
      </div>
    </div>
  );
}
