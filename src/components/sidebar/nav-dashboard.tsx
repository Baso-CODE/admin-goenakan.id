"use client";

import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  MoreHorizontal,
  PackageSearch,
  Settings,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavDashboards({
  projects,
}: {
  projects: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            {/* === MENU ITEM === */}
            <SidebarMenuButton asChild>
              <Link href={item.url} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.name}</span>
              </Link>
            </SidebarMenuButton>

            {/* === ACTION DROPDOWN === */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}>
                <DropdownMenuItem>
                  <Building2 className="text-muted-foreground h-4 w-4" />
                  <span>Vendors</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PackageSearch className="text-muted-foreground h-4 w-4" />
                  <span>Orders</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="text-muted-foreground h-4 w-4" />
                  <span>Receivables & Payables</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="text-muted-foreground h-4 w-4" />
                  <span>Quotations</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart3 className="text-muted-foreground h-4 w-4" />
                  <span>Reports</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="text-muted-foreground h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
