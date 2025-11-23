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
import { countries } from "@/lib/countries";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function VendorAddressField({ form }: any) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [subDistricts, setSubDistricts] = useState<any[]>([]);

  const country = form.watch("country");
  const province = form.watch("province");
  const city = form.watch("city");
  const district = form.watch("district");

  // Fetch provinces (once)
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then(setProvinces)
      .catch((err) => console.error("Error provinces:", err));
  }, []);

  // Fetch cities when province selected
  useEffect(() => {
    if (!province || country !== "Indonesia") {
      setCities([]);
      return;
    }

    const prov = provinces.find((p) => p.name === province);
    if (!prov) return;

    fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${prov.id}.json`
    )
      .then((r) => r.json())
      .then(setCities);
  }, [province, country]);

  // Fetch districts when city selected
  useEffect(() => {
    if (!city || country !== "Indonesia") {
      setDistricts([]);
      return;
    }

    const c = cities.find((p) => p.name === city);
    if (!c) return;

    fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${c.id}.json`
    )
      .then((r) => r.json())
      .then(setDistricts);
  }, [city, country]);

  // Fetch sub-district
  useEffect(() => {
    if (!district || country !== "Indonesia") {
      setSubDistricts([]);
      return;
    }

    const dist = districts.find((p) => p.name === district);
    if (!dist) return;

    fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${dist.id}.json`
    )
      .then((r) => r.json())
      .then(setSubDistricts);
  }, [district, country]);

  // REUSABLE select popover item
  const SelectPopover = ({
    label,
    name,
    value,
    list,
    placeholder,
    disabled,
    onSelect,
  }: any) => (
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
                  disabled={disabled}
                  className="w-full justify-between rounded-xl h-11"
                >
                  {field.value || placeholder}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>

            <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
              <Command>
                <CommandInput
                  placeholder={`Search ${label.toLowerCase()}...`}
                />

                <CommandList>
                  <CommandEmpty>No data found</CommandEmpty>

                  <CommandGroup>
                    {list?.map((item: any) => (
                      <CommandItem
                        key={item.id || item.name}
                        value={item.name}
                        onSelect={() => {
                          field.onChange(item.name);
                          if (onSelect) onSelect(item.name);
                        }}
                      >
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* COUNTRY */}
      <SelectPopover
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
          label="Sub-District"
          name="subDistrict"
          value={district}
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
