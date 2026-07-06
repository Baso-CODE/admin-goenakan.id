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
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApi } from "@/hooks/useApi";
import { countries } from "@/lib/countries";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

const WILAYAH_BASE_PATH = "/wilayah";

interface SelectPopoverProps {
  form: any;
  label: string;
  name: string;
  value?: string;
  list: any[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  onSelect?: (value: string) => void;
}

const SelectPopover = ({
  form,
  label,
  name,
  list,
  placeholder,
  disabled,
  loading,
  onSelect,
}: SelectPopoverProps) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>

        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant="outline"
                disabled={disabled || loading}
                className="w-full justify-between rounded-xl h-11">
                {loading ? "Loading..." : field.value || placeholder}
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
            <Command>
              <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />

              <CommandList>
                {loading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Loading data...
                  </div>
                ) : (
                  <CommandEmpty>No data found</CommandEmpty>
                )}

                <CommandGroup>
                  {list?.map((item: any) => (
                    <CommandItem
                      key={item.code || item.name}
                      value={item.name}
                      onSelect={() => {
                        field.onChange(item.name);
                        if (onSelect) onSelect(item.name);
                      }}>
                      {item.flag && (
                        <span className="mr-2 text-xl">{item.flag}</span>
                      )}
                      {item.name}
                      {field.value === item.name && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <FormMessage />
      </FormItem>
    )}
  />
);

export default function VendorAddressField({ form }: any) {
  const { fetchApi } = useApi();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subDistricts, setSubDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const country = form.watch("country");
  const province = form.watch("province");
  const city = form.watch("city");
  const district = form.watch("district");

  // Fetch provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoading(true);
        const res = await fetchApi(`${WILAYAH_BASE_PATH}/provinces`);
        const data = await res.json();
        setProvinces(data.data);
      } catch (err) {
        console.error("Error fetching provinces:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProvinces();
  }, [fetchApi]);

  // Fetch cities
  useEffect(() => {
    if (!province || country !== "Indonesia") return;
    const prov = provinces.find((p) => p.name === province);
    if (!prov) return;

    const fetchCities = async () => {
      setLoading(true);
      const res = await fetchApi(`${WILAYAH_BASE_PATH}/regencies/${prov.code}`);
      const data = await res.json();
      setCities(data.data);
      setLoading(false);
    };
    fetchCities();
  }, [province, country, provinces, fetchApi]);

  // Fetch districts
  useEffect(() => {
    if (!city || country !== "Indonesia") return;
    const c = cities.find((p) => p.name === city);
    if (!c) return;

    const fetchDistricts = async () => {
      setLoading(true);
      const res = await fetchApi(`${WILAYAH_BASE_PATH}/districts/${c.code}`);
      const data = await res.json();
      setDistricts(data.data);
      setLoading(false);
    };
    fetchDistricts();
  }, [city, country, cities, fetchApi]);

  // Fetch villages
  useEffect(() => {
    if (!district || country !== "Indonesia") return;
    const dist = districts.find((p) => p.name === district);
    if (!dist) return;

    const fetchSubDistricts = async () => {
      setLoading(true);
      const res = await fetchApi(`${WILAYAH_BASE_PATH}/villages/${dist.code}`);
      const data = await res.json();
      setSubDistricts(data.data);
      setLoading(false);
    };
    fetchSubDistricts();
  }, [district, country, districts, fetchApi]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* COUNTRY */}
      <SelectPopover
        form={form}
        loading={loading}
        label="Country"
        name="country"
        list={countries}
        placeholder="Select country"
        value={country}
        onSelect={() => {
          form.setValue("province", "");
          form.setValue("city", "");
          form.setValue("district", "");
          form.setValue("subDistrict", "");
        }}
      />

      {/* PROVINCE */}
      {country === "Indonesia" ? (
        <SelectPopover
          form={form}
          loading={loading}
          label="Province"
          name="province"
          value={province}
          list={provinces}
          placeholder="Select province"
          disabled={!country}
          onSelect={() => {
            form.setValue("city", "");
            form.setValue("district", "");
            form.setValue("subDistrict", "");
          }}
        />
      ) : (
        <FormField
          control={form.control}
          name="province"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province</FormLabel>
              <FormControl>
                <Input placeholder="Enter province" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {/* CITY */}
      {country === "Indonesia" ? (
        <SelectPopover
          form={form}
          loading={loading}
          label="City / Regency"
          name="city"
          value={city}
          list={cities}
          placeholder="Select city"
          disabled={!province}
          onSelect={() => {
            form.setValue("district", "");
            form.setValue("subDistrict", "");
          }}
        />
      ) : (
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="Enter city" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {/* DISTRICT */}
      {country === "Indonesia" ? (
        <SelectPopover
          form={form}
          loading={loading}
          label="District"
          name="district"
          value={district}
          list={districts}
          placeholder="Select district"
          disabled={!city}
          onSelect={() => {
            form.setValue("subDistrict", "");
          }}
        />
      ) : (
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <FormControl>
                <Input placeholder="Enter district" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {/* SUBDISTRICT */}
      {country === "Indonesia" ? (
        <SelectPopover
          form={form}
          loading={loading}
          label="Sub-District"
          name="subDistrict"
          value={form.watch("subDistrict")}
          list={subDistricts}
          placeholder="Select sub-district"
          disabled={!district}
        />
      ) : (
        <FormField
          control={form.control}
          name="subDistrict"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sub-district</FormLabel>
              <FormControl>
                <Input placeholder="Enter sub-district" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {/* POSTAL CODE */}
      <FormField
        control={form.control}
        name="postalCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Postal Code</FormLabel>
            <FormControl>
              <Input placeholder="Postal code" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
