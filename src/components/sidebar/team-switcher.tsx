"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// ⚠️ ASUMSI: Ganti path ini dengan path komponen Image Anda
import Image from "next/image";

// --- Komponen Logo Kustom Anda yang Sederhana ---
// Logo sekarang hanya berupa Image yang di-wrap dalam div relatif
const GoenakanLogo = ({ sizeClass }: { sizeClass: string }) => (
  // Div ini berfungsi sebagai wadah untuk Image, dan ukurannya dikontrol
  // oleh sizeClass (misalnya size-8 atau size-6)
  <div className={`relative shrink-0 ${sizeClass}`}>
    <Image
      src="/goenakan_logo.webp"
      alt="Goenakan Logo"
      fill
      sizes={sizeClass}
      style={{ objectFit: "contain" }} // Penting agar tidak terdistorsi
    />
  </div>
);
// --- Akhir Komponen Logo Kustom ---

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo?: React.ElementType;
    plan: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* 🔄 PERUBAHAN DI TRIGGER: Hapus BG, atur ukuran via sizeClass="size-8 aspect-square" */}
              <GoenakanLogo sizeClass="size-10 aspect-square" />

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                {/* 🔄 PERUBAHAN DI DAFTAR ITEM: Hapus BG, atur ukuran via sizeClass="size-6 aspect-square" */}
                <GoenakanLogo sizeClass="size-6 aspect-square" />

                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
