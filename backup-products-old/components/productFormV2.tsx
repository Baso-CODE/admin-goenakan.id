"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useProductForm } from "@/hooks/useProductForm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, RefreshCw, X } from "lucide-react";
import { AddItemCategoryModal } from "../../item-categories-product/components/addItemCategoryModal";
import { AddItemNameModal } from "../../item-names-product/components/addItemNameModal";
import CreateCategoryModal from "../../product-categories/components/createCategoryModal";
import MaterialTypeForm from "../../product-materials/components/materialTypeForm";
import { AttributeSelector } from "./AttributeSelector";
import { PriceTiers } from "./PriceTiers";
import { ProductFormValues } from "./product.schema";
import { UploadImages } from "./upload-images";
import { UploadVideos } from "./upload-videos";
import { VariantList } from "./VariantList";

export default function ProductFormV2({
  onSubmit,
  isLoading = false,
  isSubmitting = false,
}: {
  onSubmit: (data: ProductFormValues, files: any) => Promise<void>;
  isLoading?: boolean;
  isSubmitting?: boolean;
}) {
  const { form, submit, state, setters, handlers } = useProductForm(onSubmit);

  const onInvalid = (errors: any) => {
    const fieldLabels: Record<string, string> = {
      name: "Nama Produk",
      categoryId: "Kategori Produk",
      itemCategoryId: "Item Category",
      itemNameId: "Item Name",
      materialTypeId: "Material Type",
      basePrice: "Harga Dasar",
      description: "Deskripsi",
      sku: "SKU",
      weight: "Berat",
      length: "Panjang",
      width: "Lebar",
      height: "Tinggi",
    };

    const missingFields = Object.keys(errors)
      .map((key) => fieldLabels[key] || key);

    toast.error(`Mohon lengkapi field berikut: ${missingFields.join(", ")}`);
  };

  return (
    <Card className="w-full pt-2">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit, onInvalid)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Produk</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori Produk</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        if (val === "ADD_NEW_CATEGORY")
                          return setters.setIsCategoryModalOpen(true);
                        field.onChange(val);
                        form.setValue("itemCategoryId", "");
                        form.setValue("itemNameId", "");
                      }}
                      value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {state.categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} {cat.code && `(${cat.code})`}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-stone-200 my-1 mx-1" />
                        <SelectItem
                          value="ADD_NEW_CATEGORY"
                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                          + Kategori Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itemCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Category</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        if (val === "ADD_NEW_ITEM_CATEGORY")
                          return setters.setIsItemCategoryModalOpen(true);
                        field.onChange(val);
                        form.setValue("itemNameId", "");
                      }}
                      value={field.value}
                      disabled={!state.selectedCategoryId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih item category..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {state.itemCategories.map((ic) => (
                          <SelectItem key={ic.id} value={ic.id}>
                            {ic.name} {ic.code ? `(${ic.code})` : ""}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-stone-200 my-1 mx-1" />
                        <SelectItem
                          value="ADD_NEW_ITEM_CATEGORY"
                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                          + Tambah Item Category Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itemNameId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(val) => {
                        if (val === "ADD_NEW_ITEM_NAME")
                          return setters.setIsItemNameModalOpen(true);

                        const oldVal = form.getValues("itemNameId");
                        const oldItem = state.itemNames.find((inm) => inm.id === oldVal);
                        const newItem = state.itemNames.find((inm) => inm.id === val);

                        let currentName = form.getValues("name") || "";
                        if (newItem) {
                          if (oldItem && currentName.startsWith(oldItem.name)) {
                            currentName = currentName.replace(oldItem.name, newItem.name);
                          } else if (!currentName.startsWith(newItem.name)) {
                            currentName = currentName ? `${newItem.name} ${currentName}` : newItem.name;
                          }
                          form.setValue("name", currentName);
                        }

                        field.onChange(val);
                      }}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih item name..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {state.itemNames.map((inm) => (
                          <SelectItem key={inm.id} value={inm.id}>
                            {inm.name} {inm.code ? `(${inm.code})` : ""}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-stone-200 my-1 mx-1" />
                        <SelectItem
                          value="ADD_NEW_ITEM_NAME"
                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                          + Tambah Item Name Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materialTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        if (val === "ADD_NEW_MATERIAL")
                          return setters.setIsMaterialModalOpen(true);
                        field.onChange(val);
                      }}
                      value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis material..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {state.materialTypes.map((mat) => (
                          <SelectItem key={mat.id} value={mat.id}>
                            {mat.name}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-stone-200 my-1 mx-1" />
                        <SelectItem
                          value="ADD_NEW_MATERIAL"
                          className="text-blue-600 font-bold focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-xs">
                          + Tambah Material Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Contoh: ELE-LAP-MAC-ALU-MA0001"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handlers.handleGenerateSku}
                        disabled={state.isGeneratingSku}>
                        <RefreshCw
                          className={`h-4 w-4 ${state.isGeneratingSku ? "animate-spin" : ""}`}
                        />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        min={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Stok{" "}
                      {state.isCustomProduct && (
                        <span className="text-[10px] text-amber-600 italic">
                          (Diatur per Varian)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        disabled={state.isCustomProduct}
                        min={0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isCustom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Produk</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3 h-10 border rounded-md px-3 bg-white">
                        <span
                          className={`text-sm ${!field.value ? "font-bold text-primary" : "text-gray-400"}`}>
                          Standard
                        </span>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span
                          className={`text-sm ${field.value ? "font-bold text-primary" : "text-gray-400"}`}>
                          Custom
                        </span>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* TAGS */}
            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => {
                const selectedTags = field.value || [];
                return (
                  <FormItem className="flex flex-col mt-4">
                    <FormLabel>Product Tags</FormLabel>
                    <Popover
                      open={state.tagSearchOpen}
                      onOpenChange={setters.setTagSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-auto min-h-10 text-left bg-white",
                              selectedTags.length === 0 &&
                                "text-muted-foreground",
                            )}>
                            <div className="flex flex-wrap gap-1 items-center">
                              {selectedTags.length > 0
                                ? selectedTags.map((tagId) => {
                                    const tagInfo = state.tags.find(
                                      (t) => t.id === tagId,
                                    );
                                    if (!tagInfo) return null;
                                    return (
                                      <Badge
                                        key={tagId}
                                        variant="secondary"
                                        className="mr-1 mb-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          field.onChange(
                                            selectedTags.filter(
                                              (id) => id !== tagId,
                                            ),
                                          );
                                        }}>
                                        {tagInfo.name}{" "}
                                        <X className="h-3 w-3 ml-1 text-slate-500 hover:text-red-500" />
                                      </Badge>
                                    );
                                  })
                                : "Pilih tag produk..."}
                            </div>
                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Cari tag..."
                            value={state.tagSearchQuery}
                            onValueChange={setters.setTagSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>Tag tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {state.tags.map((tag) => (
                                <CommandItem
                                  key={tag.id}
                                  onSelect={() => {
                                    field.onChange(
                                      selectedTags.includes(tag.id)
                                        ? selectedTags.filter(
                                            (id) => id !== tag.id,
                                          )
                                        : [...selectedTags, tag.id],
                                    );
                                    setters.setTagSearchQuery("");
                                  }}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedTags.includes(tag.id)
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {tag.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            <div className="h-px bg-stone-200 my-1 mx-1" />
                            <CommandItem
                              onSelect={() => {
                                setters.setIsTagModalOpen(true);
                                setters.setTagSearchOpen(false);
                              }}
                              className="text-blue-600 font-bold justify-center text-xs">
                              + Tambah Tag Baru Sekaligus
                            </CommandItem>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                );
              }}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4 mt-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berat (gram)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Panjang (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lebar (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tinggi (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="mt-6">
              <PriceTiers />
            </div>

            {/* Media Produk */}
            <div className="space-y-6 rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold tracking-tight border-b pb-3 mb-3">
                📸 Media Produk
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-gray-100 p-4 rounded-lg shadow-sm">
                  <UploadImages
                    form={form}
                    metadataName="imagesMetadata"
                    name="imageFiles"
                    label="Gambar Utama"
                    max={10}
                    onFilesChange={setters.setProductImagesFiles}
                  />
                </div>
                <div className="border border-gray-100 p-4 rounded-lg shadow-sm">
                  <UploadVideos
                    form={form}
                    metadataName="videosMetadata"
                    label="Video Promosi"
                    max={3}
                  />
                </div>
              </div>
            </div>

            {state.isCustomProduct && (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="border rounded p-4 bg-gray-50/50">
                  <h3 className="font-semibold mb-3 text-lg">
                    Konfigurasi Varian
                  </h3>
                  <AttributeSelector
                    value={state.attributeSelections}
                    onChange={handlers.handleAddAttributeToForm}
                  />
                  <div className="border-t mt-3 pt-3 flex justify-end">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={handlers.handleGenerateVariants}>
                      Generate Variants
                    </Button>
                  </div>
                </div>
                {state.combinations.length > 0 && (
                  <div className="border rounded p-4 mt-4 bg-gray-50/50">
                    <VariantList
                      combinations={state.combinations}
                      variantMetas={state.variantMetas}
                      onUpdateVariantMeta={handlers.handleUpdateVariantMeta}
                      onChangeMeta={setters.setVariantFilesMap}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting && (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                )}{" "}
                Create Product
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      {/* MODALS */}
      <CreateCategoryModal
        isOpen={state.isCategoryModalOpen}
        onClose={() => setters.setIsCategoryModalOpen(false)}
        onSuccess={(newCat) => {
          const mappedCategory = {
            ...newCat,
            name: newCat.name || newCat.name_id || newCat.name_en,
          };

          setters.setCategories((p) => [...p, mappedCategory]);
          form.setValue("categoryId", mappedCategory.id);
          form.setValue("itemCategoryId", "");
          form.setValue("itemNameId", "");
        }}
      />
      <AddItemCategoryModal
        isOpen={state.isItemCategoryModalOpen}
        onClose={() => setters.setIsItemCategoryModalOpen(false)}
        parentCategoryId={state.selectedCategoryId}
        onSuccess={(newCat) => {
          setters.setItemCategories((p) => [...p, newCat]);
          form.setValue("itemCategoryId", newCat.id);
          form.setValue("itemNameId", "");
        }}
      />
      <AddItemNameModal
        isOpen={state.isItemNameModalOpen}
        onClose={() => setters.setIsItemNameModalOpen(false)}
        parentCategoryId={state.selectedCategoryId}
        parentItemCategoryId={state.selectedItemCategoryId}
        productCategories={state.categories}
        itemCategories={state.itemCategories}
        onSuccess={(newName) => {
          setters.setItemNames((p) => [...p, newName]);

          const oldVal = form.getValues("itemNameId");
          const oldItem = state.itemNames.find((inm) => inm.id === oldVal);

          let currentName = form.getValues("name") || "";
          if (oldItem && currentName.startsWith(oldItem.name)) {
            currentName = currentName.replace(oldItem.name, newName.name);
          } else if (!currentName.startsWith(newName.name)) {
            currentName = currentName ? `${newName.name} ${currentName}` : newName.name;
          }
          form.setValue("name", currentName);

          form.setValue("itemNameId", newName.id);
        }}
      />

      <Dialog
        open={state.isTagModalOpen}
        onOpenChange={setters.setIsTagModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Tags Baru</DialogTitle>
            <DialogDescription>Pisahkan dengan koma ( , )</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={state.bulkTagInput}
              onChange={(e) => setters.setBulkTagInput(e.target.value)}
              disabled={state.isSubmittingTags}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setters.setIsTagModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handlers.handleBulkCreateTags}
              disabled={state.isSubmittingTags}>
              {state.isSubmittingTags ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={state.isMaterialModalOpen}
        onOpenChange={setters.setIsMaterialModalOpen}>
        <DialogContent className="sm:max-w-140 bg-[oklch(0.98_0.02_90)]">
          <DialogHeader>
            <DialogTitle>Tambah Material Baru</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <MaterialTypeForm
              onSubmit={handlers.handleAddMaterialSubmit}
              isSubmitting={state.isSubmittingMaterial}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
