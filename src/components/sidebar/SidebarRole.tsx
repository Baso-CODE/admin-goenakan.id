"use client";

import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SIDEBAR_MENU } from "@/config/sidebarMenu";
import { getAccessibleAdminRoutes } from "@/lib/adminAccess";
import type { LucideIcon } from "lucide-react";
import {
  AudioWaveform,
  Calculator,
  Command,
  FileSpreadsheet,
  FileText,
  Frame,
  GalleryVerticalEnd,
  HandshakeIcon,
  LayoutTemplate,
  ListOrdered,
  Megaphone,
  MessageSquare,
  MessageSquareQuote,
  Package,
  Search,
  Settings,
  Store,
  Truck,
  UserCircle,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NavMain } from "./NavMain";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

const ICONS: Record<string, LucideIcon> = {
  orders: ListOrdered,
  invoice: FileSpreadsheet,
  logistic: Truck,
  quotation: MessageSquareQuote,
  purchase: FileText,
  vendor: Store,
  client: UserCircle,
  product: Package,
  cogs: Calculator,
  sales: HandshakeIcon,
  users: Users,
  article: FileText,
  content: LayoutTemplate,
  marketing: Megaphone,
  whatsapp: MessageSquare,
  settings: Settings,
};

export default function SidebarRole({ ...props }) {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");

  const role = session?.user?.role || "";

  const userPermissions = useMemo<string[]>(
    () => session?.user?.permissions || [],
    [session?.user?.permissions],
  );

  const isSuperAdmin = role === "SUPER_ADMIN";

  const accessibleRoutes = useMemo(
    () => getAccessibleAdminRoutes(role, userPermissions),
    [role, userPermissions],
  );

  const accessibleRouteUrls = useMemo(
    () => new Set(accessibleRoutes.map((route) => route.url)),
    [accessibleRoutes],
  );

  const visibleSections = useMemo(() => {
    return SIDEBAR_MENU.map((section) => {
      const groups = section.groups
        .map((group) => {
          const children = group.children.filter((child) =>
            accessibleRouteUrls.has(child.routeUrl),
          );

          return {
            ...group,
            children,
          };
        })
        .filter((group) => group.children.length > 0);

      return {
        ...section,
        groups,
      };
    }).filter((section) => section.groups.length > 0);
  }, [accessibleRouteUrls]);

  const navSections = useMemo(() => {
    return visibleSections.map((section) => ({
      title: section.title,
      items: section.groups.map((group) => ({
        title: group.title,
        url: "#",
        icon: ICONS[group.icon],
        items: group.children.map((child) => ({
          title: child.title,
          url: child.href || child.routeUrl,
        })),
      })),
    }));
  }, [visibleSections]);

  const searchablePages = useMemo(() => {
    const pages = visibleSections.flatMap((section) =>
      section.groups.flatMap((group) =>
        group.children.map((child) => ({
          title: child.title,
          url: child.href || child.routeUrl,
          section: section.title,
          group: group.title,
          icon: ICONS[group.icon],
        })),
      ),
    );

    if (isSuperAdmin) {
      pages.unshift({
        title: "Main Dashboard",
        url: "/super-admin",
        section: "Dashboard",
        group: "Dashboard",
        icon: Frame,
      });
    }

    return pages;
  }, [visibleSections, isSuperAdmin]);

  const searchResults = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    return searchablePages.filter((page) => {
      const searchableText = [page.title, page.section, page.group]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [search, searchablePages]);

  const userData = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  };

  const teams = [
    {
      name: "Admin Team",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Invoice Dept",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Article Dept",
      logo: Command,
      plan: "Free",
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />

        <div className="relative px-2 group-data-[collapsible=icon]:hidden">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari halaman..."
            className="pl-9"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {search.trim() ? (
          <SidebarGroup>
            <div className="px-2 pb-2 text-xs font-semibold text-muted-foreground">
              Hasil Pencarian
            </div>

            <SidebarMenu>
              {searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={`${item.url}-${item.title}`}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link href={item.url} onClick={() => setSearch("")}>
                          <Icon />

                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">
                              {item.title}
                            </span>

                            <span className="truncate text-[10px] text-muted-foreground">
                              {item.section} • {item.group}
                            </span>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              ) : (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Halaman tidak ditemukan
                </div>
              )}
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          <>
            {isSuperAdmin && (
              <SidebarGroup>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Main Dashboard">
                      <Link href="/super-admin">
                        <Frame />
                        <span className="font-medium">Main Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}

            {navSections.map((section) => (
              <NavMain
                key={section.title}
                label={section.title}
                items={section.items}
              />
            ))}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
