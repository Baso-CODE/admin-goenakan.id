"use client";

import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  FileText,
  Lightbulb,
  PenLine,
  Receipt,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  GUIDE_MODULES,
  type GuideModule,
  type UserGuide,
} from "@/config/userGuides";

const MODULE_ICONS = {
  invoice: Receipt,
  quotation: FileText,
  signature: PenLine,
  user: Users,
  role: ShieldCheck,
};

type Props = {
  guides: UserGuide[];
  compact?: boolean;
};

export default function GuideCatalog({ guides, compact = false }: Props) {
  const [search, setSearch] = useState("");

  const filteredGuides = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return guides;
    }

    return guides.filter((guide) =>
      [
        guide.title,
        guide.description,
        GUIDE_MODULES[guide.module].title,
        ...guide.steps,
        ...(guide.tips ?? []),
        ...(guide.warnings ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [guides, search]);

  const modules = (Object.keys(GUIDE_MODULES) as GuideModule[]).filter(
    (module) => filteredGuides.some((guide) => guide.module === module),
  );

  return (
    <div className="min-w-0 space-y-5">
      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari panduan penggunaan..."
          className="h-11 pl-10"
          aria-label="Cari panduan penggunaan"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredGuides.length} panduan tersedia
      </p>

      {/* EMPTY STATE */}
      {modules.length === 0 && (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

          <p className="font-medium">Panduan tidak ditemukan</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan kata kunci lain atau periksa hak akses akun Anda.
          </p>
        </div>
      )}

      {/* MODULES */}
      <div className="space-y-6">
        {modules.map((module) => {
          const info = GUIDE_MODULES[module];
          const Icon = MODULE_ICONS[module];

          const moduleGuides = filteredGuides.filter(
            (guide) => guide.module === module,
          );

          return (
            <section
              key={module}
              id={module}
              className="scroll-mt-24 overflow-hidden rounded-xl border bg-card">
              {/* MODULE HEADER */}
              <div className="flex items-start gap-3 border-b bg-muted/30 p-4">
                <div className="rounded-lg border bg-background p-2">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{info.title}</h2>

                  {!compact && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {info.description}
                    </p>
                  )}
                </div>

                <Badge variant="secondary">{moduleGuides.length}</Badge>
              </div>

              {/* GUIDE ITEMS */}
              <div className="divide-y">
                {moduleGuides.map((guide) => (
                  <details key={guide.id} className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition-colors hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium">{guide.title}</h3>

                          {guide.superAdminOnly && (
                            <Badge variant="outline" className="text-[10px]">
                              Super Admin
                            </Badge>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {guide.description}
                        </p>
                      </div>

                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>

                    <div className="space-y-5 px-4 pb-5 sm:px-6">
                      {/* STEPS */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Langkah Penggunaan
                        </h4>

                        <ol className="space-y-3">
                          {guide.steps.map((step, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {index + 1}
                              </span>

                              <span className="pt-0.5 text-sm leading-relaxed">
                                {step}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* TIPS */}
                      {!!guide.tips?.length && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                            <Lightbulb className="h-4 w-4" />
                            Informasi Tambahan
                          </div>

                          <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-blue-800 dark:text-blue-200">
                            {guide.tips.map((tip, index) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* WARNINGS */}
                      {!!guide.warnings?.length && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="h-4 w-4" />
                            Perhatian
                          </div>

                          <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                            {guide.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
