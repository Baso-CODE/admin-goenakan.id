import { BookOpen, HelpCircle } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";

import {
  getVisibleGuides,
  GUIDE_MODULES,
  type GuideModule,
} from "@/config/userGuides";

import GuideCatalog from "@/components/guideCatalog";
import { authOptions } from "@/lib/authOptions";

export default async function DocumentationPage() {
  const session = await getServerSession(authOptions);

  if (
    !session?.user?.id ||
    !session.user.roleId ||
    !session.user.role ||
    session.user.role === "CUSTOMER"
  ) {
    redirect("/login");
  }

  const guides = getVisibleGuides(
    session.user.role,
    session.user.permissions ?? [],
  );

  const availableModules = (Object.keys(GUIDE_MODULES) as GuideModule[]).filter(
    (module) => guides.some((guide) => guide.module === module),
  );

  return (
    <div className="mx-auto w-full space-y-6 pb-10">
      {/* HERO */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white sm:p-9">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl space-y-3">
            <Badge className="border border-white/20 bg-white/10 text-white hover:bg-white/10">
              GOENAKAN INDONESIA
            </Badge>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Documentation Center
            </h1>

            <p className="text-sm leading-relaxed text-slate-300">
              Pelajari cara menggunakan Admin Portal Goenakan Indonesia melalui
              panduan langkah demi langkah yang sesuai dengan hak akses akun
              Anda.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                {availableModules.length} Modul
              </span>

              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                {guides.length} Panduan
              </span>

              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                {session.user.role.replaceAll("_", " ")}
              </span>
            </div>
          </div>

          <BookOpen className="hidden h-24 w-24 shrink-0 text-white/20 sm:block" />
        </div>
      </section>

      {/* DOCUMENTATION LAYOUT */}
      <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* TABLE OF CONTENTS */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold">Daftar Isi</h2>

            <nav className="space-y-1">
              {availableModules.map((module) => (
                <a
                  key={module}
                  href={`#${module}`}
                  className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  {GUIDE_MODULES[module].title}
                </a>
              ))}
            </nav>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <HelpCircle className="mb-3 h-5 w-5 text-muted-foreground" />

            <h3 className="text-sm font-semibold">Butuh Bantuan?</h3>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Jika kendala belum tercakup dalam panduan, hubungi Super Admin
              atau tim IT dengan menyertakan informasi kendala dan screenshot
              yang relevan.
            </p>
          </div>
        </aside>

        {/* ALL GUIDES */}
        <GuideCatalog guides={guides} />
      </div>
    </div>
  );
}
