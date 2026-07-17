"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, ListPlus, Loader2, Tag, Trash2, Plus } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { parseColorValue, cmykToRgb, cmykToHex } from "@/utils/colorConverter";
import { ColorValueInput } from "@/components/ui/color-value-input";



// ===================== Schema ===================== //



interface ValueType {
  id?: string;
  value: string;
  deleted?: boolean;
  position?: number;
  subAttributes?: AttributeType[];
}

interface AttributeType {
  id?: string;
  name: string;
  type?: string;
  parentValueId?: string | null;
  values: ValueType[];
}

const valueSchema: z.ZodType<ValueType> = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    value: z.string().min(1, "Value is required"),
    deleted: z.boolean().optional(),
    position: z.number().optional(),
    subAttributes: z.array(attributeSchema).optional(),
  })
);

export const attributeSchema: z.ZodType<AttributeType> = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Attribute name must be at least 2 characters"),
    type: z.string().optional(),
    parentValueId: z.string().optional().nullable(),
    values: z.array(valueSchema).min(1, "At least one value is required"),
  })
);

export type AttributeFormValues = AttributeType;

// ===================== Component ===================== //

export default function AttributeForm({
  initialData,
  onSubmit,
  isLoading = false,
  isSubmitting = false,
  attributeId,
}: {
  initialData?: AttributeFormValues;
  onSubmit: (data: AttributeFormValues) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
  attributeId?: string;
}) {
  const { fetchApi, status } = useApi();


  const form = useForm<any>({
    resolver: zodResolver(attributeSchema as any),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "TEXT",
      parentValueId: initialData?.parentValueId || null,
      values: initialData?.values || [{ value: "", hasSubAttributes: false }],
    },
  });



  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        type: initialData.type || "TEXT",
        parentValueId: initialData.parentValueId || null,
        values: initialData.values,
      });
    }
  }, [initialData, form]);



  const { control } = form;
  const currentType = form.watch("type");
  const formValuesList = form.watch("values") || [];

  const { fields, append, remove, move } = useFieldArray({
    name: "values",
    control,
  });

  const handleSubmit = (values: AttributeFormValues) => {
    let activeIdx = 0;
    const valuesWithPositions = {
      ...values,
      values: values.values.map((v) => {
        if (v.deleted) {
          return v;
        }
        const updated = { ...v, position: activeIdx };
        activeIdx++;
        return updated;
      }),
    };
    onSubmit(valuesWithPositions);
  };

  const visibleFields = fields
    .map((field, index) => ({ field, index, item: form.watch(`values.${index}`) }))
    .filter((x) => !x.item?.deleted);

  return (
    <Card className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="pt-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 w-full">
            {/* ===================== Attribute Name ===================== */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    Attribute Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Input attribute name (e.g., Color)"
                      {...field}
                      disabled={isLoading || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ===================== Attribute Type ===================== */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attribute Type</FormLabel>
                  <Select
                    disabled={isLoading || isSubmitting}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TEXT">Text (Default)</SelectItem>
                      <SelectItem value="COLOR">Color Swatch</SelectItem>
                      <SelectItem value="SIZE">Size / Capacity</SelectItem>
                      <SelectItem value="MOCKUP_SIDE">Mockup Side / Print Position</SelectItem>
                      <SelectItem value="PRINT_SIDE">Jumlah Sisi Print</SelectItem>
                      <SelectItem value="MODEL_SHAPE">Model / Shape</SelectItem>
                      <SelectItem value="PRINT_METHOD">Printing Method</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />




            <div className="space-y-4">
              <FormLabel>Attribute Values</FormLabel>



              {visibleFields.map(({ field, index }, i) => {
                const valuePath = `values.${index}`;
                return (
                  <div key={field.id} className="border border-stone-200 p-4 rounded-md bg-stone-50/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <FormField
                        control={form.control}
                        name={`values.${index}.value`}
                        render={({ field }) => {
                          let namePart = field.value || "";
                          let hexPart = "#000000";
                          if (field.value.includes("|")) {
                            const parts = field.value.split("|");
                            namePart = parts[0];
                            hexPart = parts[1];
                          }

                          return (
                            <FormItem className="flex-1">
                              <FormControl>
                                {currentType === "COLOR" ? (
                                  <ColorValueInput
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                ) : currentType === "PRINT_SIDE" ? (
                                  <Input type="number" placeholder="Enter number of print sides..." {...field} />
                                ) : (
                                  <Input {...field} />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 p-0"
                          disabled={i === 0 || isLoading || isSubmitting}
                          onClick={() => move(index, visibleFields[i - 1].index)}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 p-0"
                          disabled={i === visibleFields.length - 1 || isLoading || isSubmitting}
                          onClick={() => move(index, visibleFields[i + 1].index)}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        className="p-2"
                        onClick={() => {
                          const current = form.getValues("values");

                          if (current[index].id) {
                            form.setValue(`values.${index}.deleted`, true);
                          } else {
                            remove(index);
                          }
                        }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2 pt-1.5 pl-1 select-none">
                      <Checkbox
                        id={`has-sub-${field.id}`}
                        checked={form.watch(`${valuePath}.hasSubAttributes`) || false}
                        onCheckedChange={(checked) => {
                          form.setValue(`${valuePath}.hasSubAttributes`, !!checked);
                          if (!checked) {
                            form.setValue(`${valuePath}.subAttributes`, []);
                          }
                        }}
                      />
                      <label
                        htmlFor={`has-sub-${field.id}`}
                        className="text-xs font-semibold text-stone-500 cursor-pointer select-none"
                      >
                        Enable sub-attributes for this value
                      </label>
                    </div>

                    {(form.watch(`${valuePath}.hasSubAttributes`) || false) && (
                      <SubValuesGroupEditor
                        parentPath={valuePath}
                        control={control}
                        form={form}
                        level={1}
                      />
                    )}
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => append({ value: "" })}
                disabled={isLoading || isSubmitting}>
                <ListPlus className="h-4 w-4" /> Add Value
              </Button>
            </div>

            {/* ===================== Submit Button ===================== */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Tag className="h-4 w-4 mr-2" />
                )}

                {initialData ? "Update Attribute" : "Save Attribute"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ===================== Recursive Sub-Values Group Editor ===================== //

function SubValuesGroupEditor({
  parentPath,
  control,
  form,
  level = 1,
}: {
  parentPath: string;
  control: any;
  form: any;
  level: number;
}) {
  const parentName = form.watch("name") || "Sub-attribute";
  const parentType = form.watch("type") || "TEXT";

  // Watch the subAttributes array
  const subAttributes = form.watch(`${parentPath}.subAttributes`) || [];

  // Ensure there is exactly one sub-attribute when this component is mounted
  useEffect(() => {
    if (!subAttributes || subAttributes.length === 0) {
      form.setValue(`${parentPath}.subAttributes`, [
        {
          name: parentName,
          type: parentType,
          values: [{ value: "" }],
        },
      ]);
    } else {
      // Sync name and type
      if (subAttributes[0]?.name !== parentName) {
        form.setValue(`${parentPath}.subAttributes.0.name`, parentName);
      }
      if (subAttributes[0]?.type !== parentType) {
        form.setValue(`${parentPath}.subAttributes.0.type`, parentType);
      }
    }
  }, [parentName, parentType, parentPath, form, subAttributes]);

  if (level > 3) return null; // Prevent layout rendering issues from too deep nesting

  const subAttrPath = `${parentPath}.subAttributes.0`;

  return (
    <div className="mt-3 pl-4 border-l-2 border-indigo-200 space-y-3 bg-stone-50/40 p-3 rounded-sm">
      <div className="text-[10px] font-bold text-indigo-650 flex items-center gap-1 uppercase tracking-wider">
        <span>Level {level} Sub-Values</span>
      </div>

      <SubValuesEditor
        subAttrPath={subAttrPath}
        control={control}
        form={form}
        type={parentType}
        level={level}
      />
    </div>
  );
}

function SubValuesEditor({
  subAttrPath,
  control,
  form,
  type,
  level,
}: {
  subAttrPath: string;
  control: any;
  form: any;
  type: string;
  level: number;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${subAttrPath}.values`,
  });

  return (
    <div className="space-y-2 mt-2">
      <Label className="text-xs font-semibold text-stone-500">Values</Label>
      
      {fields.map((field, index) => {
        const valuePath = `${subAttrPath}.values.${index}`;
        const valValue = form.watch(`${valuePath}.value`) || "";
        
        let namePart = valValue;
        let hexPart = "#000000";
        if (valValue.includes("|")) {
          const parts = valValue.split("|");
          namePart = parts[0];
          hexPart = parts[1];
        }

        return (
          <div key={field.id} className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2">
              {type === "COLOR" ? (
                <ColorValueInput
                  value={valValue}
                  onChange={(newVal) => form.setValue(`${valuePath}.value`, newVal)}
                />
              ) : (
                <Input
                  placeholder={`Value #${index + 1}`}
                  {...form.register(`${valuePath}.value`)}
                  className="flex-1 h-9"
                  required
                />
              )}

              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-red-500 hover:text-red-700"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-1 pl-1 select-none">
              <Checkbox
                id={`has-sub-${field.id}`}
                checked={form.watch(`${valuePath}.hasSubAttributes`) || false}
                onCheckedChange={(checked) => {
                  form.setValue(`${valuePath}.hasSubAttributes`, !!checked);
                  if (!checked) {
                    form.setValue(`${valuePath}.subAttributes`, []);
                  }
                }}
              />
              <label
                htmlFor={`has-sub-${field.id}`}
                className="text-[11px] font-semibold text-stone-500 cursor-pointer select-none"
              >
                Enable sub-attributes
              </label>
            </div>

            {(form.watch(`${valuePath}.hasSubAttributes`) || false) && (
              <SubValuesGroupEditor
                parentPath={valuePath}
                control={control}
                form={form}
                level={level + 1}
              />
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-[11px] h-6 text-stone-500 hover:text-stone-700"
        onClick={() => append({ value: "" })}
      >
        <Plus className="h-3 w-3 mr-1" /> Add Value Choice
      </Button>
    </div>
  );
}
