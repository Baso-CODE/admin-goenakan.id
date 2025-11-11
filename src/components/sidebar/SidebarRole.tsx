"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";

// === ICONS ===
import {
  AudioWaveform,
  Command,
  FileSpreadsheet,
  FileText,
  Frame,
  GalleryVerticalEnd,
  HandshakeIcon,
  ListOrdered,
  Map,
  Package,
  PieChart,
  Settings,
  Store,
  Tags,
  UserCircle,
  Users,
} from "lucide-react";
import { NavMain } from "./NavMain";
import { NavDashboards } from "./nav-dashboard";
import { NavProjects } from "./nav-project";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

export default function SidebarRole({ ...props }) {
  const { data: session } = useSession();

  // Jika tidak ada session atau user tidak punya role, redirect atau kosongkan sidebar
  const role = session?.user?.role as
    | "SUPER_ADMIN"
    | "ADMIN_INVOICE"
    | "ADMIN_ARTICLE"
    | undefined;

  // === BASE DATA ===
  const data = {
    user: {
      name: session?.user.name || "Super Admin",
      email: session?.user.email || "admin@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      { name: "Admin Team", logo: GalleryVerticalEnd, plan: "Enterprise" },
      { name: "Invoice Dept", logo: AudioWaveform, plan: "Startup" },
      { name: "Article Dept", logo: Command, plan: "Free" },
    ],
    navMain: [
      {
        title: "Vendor Management",
        url: "#",
        icon: Store,
        items: [
          { title: "Vendors", url: "/super-admin/vendors" },
          { title: "Vendor Items", url: "/super-admin/vendor-items" },
          { title: "Vendor Categories", url: "/super-admin/vendor-categories" },
          { title: "Platform", url: "/super-admin/contact-platforms" },
        ],
      },
      {
        title: "Product Management",
        url: "#",
        icon: Package,
        items: [
          { title: "Products", url: "/super-admin/products", icon: Package },
          {
            title: "Product Categories",
            url: "/super-admin/product-categories",
            icon: Tags,
          },
        ],
      },
      {
        title: "Invoice Management",
        url: "#",
        icon: FileSpreadsheet,
        items: [
          { title: "Invoices", url: "/admin-invoice/invoices" },
          { title: "Payments", url: "/admin-invoice/payments" },
        ],
      },
      {
        title: "Client Management",
        url: "#",
        icon: UserCircle,
        items: [
          { title: "All Client", url: "/super-admin/clients" },
          { title: "Add Client", url: "/super-admin/clients/add" },
        ],
      },
      {
        title: "Article Management",
        url: "#",
        icon: FileText,
        items: [
          { title: "Articles", url: "/admin-article/articles" },
          { title: "Categories", url: "/admin-article/categories" },
        ],
      },
      {
        title: "User Management",
        url: "#",
        icon: Users,
        items: [{ title: "All Users", url: "/super-admin/users" }],
      },
      {
        title: "Sales Management",
        url: "#",
        icon: HandshakeIcon,
        items: [
          { title: "All Sales", url: "/super-admin/sales" },
          { title: "All Account Bank Sales", url: "/super-admin/sales/bank" },
        ],
      },
      {
        title: "Order Management",
        url: "#",
        icon: ListOrdered,
        items: [
          { title: "All Order", url: "/super-admin/orders" },
          { title: "Order Analyst", url: "/super-admin/orders/add" },
        ],
      },
      { title: "Settings", url: "/super-admin/settings", icon: Settings },
    ],
    projects: [
      { name: "Design Engineering", url: "#", icon: Frame },
      { name: "Sales & Marketing", url: "#", icon: PieChart },
      { name: "Travel", url: "#", icon: Map },
    ],
    dashboard: [{ name: "Dashboard Overview", url: "#", icon: Frame }],
  };

  // === FILTER NAV MAIN BY ROLE ===
  const filteredNavMain = (() => {
    if (role === "SUPER_ADMIN") return data.navMain;
    if (role === "ADMIN_INVOICE")
      return data.navMain.filter((m) => m.title.includes("Invoice"));
    if (role === "ADMIN_ARTICLE")
      return data.navMain.filter((m) => m.title.includes("Article"));
    return [];
  })();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        <NavDashboards projects={data.dashboard} />
        <NavMain items={filteredNavMain} />
        {role === "SUPER_ADMIN" && <NavProjects projects={data.projects} />}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
