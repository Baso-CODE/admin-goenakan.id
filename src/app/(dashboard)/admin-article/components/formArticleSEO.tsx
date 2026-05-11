import {
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
import { Textarea } from "@/components/ui/textarea";

export function FormSeo({ control }: { control: any }) {
  return (
    <div className="space-y-8 bg-stone-50/30 p-6 rounded-xl border border-stone-200 shadow-sm mt-6">
      {/* ==========================================
          BAGIAN 1: BASIC SEO (Meta & Indexing)
      ========================================== */}
      <div className="space-y-6">
        <div className="border-b border-stone-200 pb-2">
          <h3 className="text-base font-bold text-stone-800">
            Basic SEO & Indexing
          </h3>
          <p className="text-xs text-stone-500">
            Informasi dan instruksi untuk mesin pencari Google.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="seo.metaTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">
                  Meta Title (Judul SEO)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Maks. 60 karakter disarankan"
                    className="bg-white"
                    {...field}
                  />
                </FormControl>
                <p className="text-[10px] text-muted-foreground">
                  Jika dikosongkan, judul artikel utama akan digunakan.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="seo.robots"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">
                  Robots Meta Directive
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "index, follow"}>
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Pilih aturan index" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="index, follow">
                      Index & Follow (Direkomendasikan)
                    </SelectItem>
                    <SelectItem value="noindex, follow">
                      No-Index & Follow
                    </SelectItem>
                    <SelectItem value="noindex, nofollow">
                      No-Index & No-Follow
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Instruksi apakah Google boleh menyimpan artikel ini.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="seo.metaDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">Meta Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tulis deskripsi singkat dan menarik tentang artikel ini (Maks. 160 karakter)"
                  className="bg-white resize-none h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="seo.keywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Meta Keywords</FormLabel>
                <FormControl>
                  <Input
                    placeholder="kata kunci 1, kata kunci 2"
                    className="bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="seo.canonicalUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-stone-600">
                  Canonical URL
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://..."
                    className="bg-white"
                    {...field}
                  />
                </FormControl>
                <p className="text-[10px] text-muted-foreground">
                  Isi hanya jika artikel ini bersumber dari URL/website lain.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* ==========================================
          BAGIAN 2: OPEN GRAPH (Social Media)
      ========================================== */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-stone-200 pb-2">
          <h3 className="text-base font-bold text-stone-800">
            Social Media (Open Graph)
          </h3>
          <p className="text-xs text-stone-500">
            Tampilan saat artikel dibagikan ke WhatsApp, Facebook, atau
            LinkedIn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="seo.ogTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">Social Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Judul untuk sosial media"
                    className="bg-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="seo.ogImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">
                  Social Image (OG:Image URL)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://..."
                    className="bg-white"
                    {...field}
                  />
                </FormControl>
                <p className="text-[10px] text-muted-foreground">
                  Jika kosong, sistem akan menggunakan Cover Image artikel.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="seo.ogDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">Social Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Deskripsi untuk sosial media"
                  className="bg-white resize-none h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* ==========================================
          BAGIAN 3: ADVANCED SEO (Structured Data)
      ========================================== */}
      <div className="space-y-6 pt-6">
        <div className="border-b border-stone-200 pb-2">
          <h3 className="text-base font-bold text-stone-800">Advanced SEO</h3>
          <p className="text-xs text-stone-500">
            Schema.org JSON-LD (Rich Snippets).
          </p>
        </div>

        <FormField
          control={control}
          name="seo.structuredData"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-bold">
                Structured Data (JSON-LD)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Article"\n}`}
                  className="bg-stone-900 text-green-400 font-mono text-xs h-32"
                  {...field}
                />
              </FormControl>
              <p className="text-[10px] text-muted-foreground">
                Pastikan format JSON valid. Fitur ini membantu artikel masuk ke
                "Top Stories" Google.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
