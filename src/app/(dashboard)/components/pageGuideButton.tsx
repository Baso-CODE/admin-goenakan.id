"use client";

import { BookOpen, ExternalLink } from "lucide-react";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import GuideCatalog from "@/components/guideCatalog";
import {
  getGuideModuleByPath,
  getVisibleGuides,
  GUIDE_MODULES,
} from "@/config/userGuides";

export default function PageGuideButton() {
  const pathname = usePathname();

  const { data: session, status } = useSession();

  if (status !== "authenticated") {
    return null;
  }

  const module = getGuideModuleByPath(pathname);

  if (!module) {
    return null;
  }

  const guides = getVisibleGuides(
    session?.user?.role ?? "",
    session?.user?.permissions ?? [],
  ).filter((guide) => guide.module === module);

  if (!guides.length) {
    return null;
  }

  const moduleInfo = GUIDE_MODULES[module];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Buka panduan halaman"
          title="Panduan Halaman">
          <BookOpen className="h-4 w-4 text-blue-600" />

          <span className="hidden md:inline">Panduan Halaman</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b px-5 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 pr-6">
            <BookOpen className="h-5 w-5 text-blue-600" />

            {moduleInfo.title}
          </DialogTitle>

          <DialogDescription>
            Panduan penggunaan fitur pada halaman yang sedang Anda buka.
          </DialogDescription>
        </DialogHeader>

        {/* SCROLLABLE GUIDE */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <GuideCatalog guides={guides} compact />
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 justify-end border-t p-4">
          <Button variant="outline" asChild>
            <Link href={`/documentation#${module}`}>
              Lihat Documentation Center
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
