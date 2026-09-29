"use client";

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
import { useSession } from "next-auth/react";

import { checkPermission } from "@/lib/roleAccess";

import {
  AlignHorizontalDistributeStart,
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
  LucideChartNetwork,
  Megaphone,
  MessageSquare,
  MessageSquareQuote,
  Package,
  Settings,
  Store,
  Tags,
  Truck,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { NavMain } from "./NavMain";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

export default function SidebarRole({ ...props }) {
  const { data: session } = useSession();

  const userPermissions = (session?.user as any)?.permissions || [];
  const role = (session?.user?.role as string) || "";

  const getPermissionFromMenuUrl = (url: string): string | null => {
    if (!url || url === "#") return null;

    // Pecah URL berdasarkan garis miring
    const segments = url.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const filteredSegments = segments.filter(
      (seg) =>
        ![
          "super-admin",
          "admin",
          "dashboard",
          "admin-invoice",
          "admin-article",
        ].includes(seg),
    );

    if (filteredSegments.length === 0) return null;

    let rawModule = filteredSegments[0];

    let cleanModule = rawModule.replace(/-/g, "_");
    if (cleanModule.endsWith("s")) {
      cleanModule = cleanModule.slice(0, -1);
    }

    return `read_${cleanModule}`;
  };

  const data = {
    user: {
      name: session?.user.name || "User",
      email: session?.user.email || "user@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      { name: "Admin Team", logo: GalleryVerticalEnd, plan: "Enterprise" },
      { name: "Invoice Dept", logo: AudioWaveform, plan: "Startup" },
      { name: "Article Dept", logo: Command, plan: "Free" },
    ],

    // 1. ORDER MANAGEMENT SECTION
    navOrder: [
      {
        title: "Orders & Dashboard",
        url: "#",
        icon: ListOrdered,
        items: [
          { title: "All Orders List", url: "/super-admin/orders" },
          {
            title: "Sample History",
            url: "/super-admin/sample-history",
          },
        ],
      },
      {
        title: "Cashflow & Invoicing",
        url: "#",
        icon: FileSpreadsheet,
        items: [
          { title: "Invoices", url: "/admin-invoice/invoices" },
          { title: "Cashflow", url: "/super-admin/cashflow" },
          { title: "Finance", url: "/super-admin/finance" },
          { title: "Currency", url: "/admin-invoice/currency" },
        ],
      },
      {
        title: "Logistic & Delivery",
        url: "#",
        icon: Truck,
        items: [
          { title: "Tracking Dashboard", url: "/super-admin/logistics" },
          {
            title: "Delivery Notes",
            url: "/super-admin/logistics/shipment-notes",
          },
        ],
      },
      {
        title: "Quotation & Follow Up",
        url: "#",
        icon: MessageSquareQuote,
        items: [
          { title: "Quotations", url: "/admin-invoice/quotations" },
          { title: "Quotation Notes", url: "/admin-invoice/quotations/notes" },
          {
            title: "Follow Up Tracking",
            url: "/admin-invoice/quotations/follow-up",
          },
        ],
      },
      {
        title: "Purchase Orders",
        url: "/super-admin/purchase-orders",
        icon: FileText,
        items: [
          { title: "All Purchase Orders", url: "/super-admin/purchase-orders" },
        ],
      },
    ],

    // 2. DATABASE SECTION
    navDatabase: [
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
        title: "Client Management",
        url: "#",
        icon: UserCircle,
        items: [
          { title: "All Client", url: "/super-admin/clients" },
          { title: "Departments", url: "/super-admin/departments" },
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
          {
            title: "Category Items",
            url: "/super-admin/item-categories-product",
            icon: Tags,
          },
          {
            title: "Item Names",
            url: "/super-admin/item-names-product",
            icon: Tags,
          },
          {
            title: "Product Materials",
            url: "/super-admin/product-materials",
            icon: Tags,
          },
          {
            title: "Product Tags",
            url: "/super-admin/product-tags",
            icon: Tags,
          },
          {
            title: "Product Attributes",
            url: "/super-admin/product-attributes",
            icon: AlignHorizontalDistributeStart,
          },
        ],
      },
      {
        title: "Supplier COGS",
        url: "#",
        icon: Calculator,
        items: [
          {
            title: "COGS Calculator",
            url: "/super-admin/supplier-cogs",
            icon: Calculator,
          },
          {
            title: "Master Pricing",
            url: "/super-admin/master-pricing",
            icon: FileText,
          },
        ],
      },
    ],

    // 3. USER MANAGEMENT SECTION
    navUserManagement: [
      {
        title: "Sales Team",
        url: "#",
        icon: HandshakeIcon,
        items: [
          { title: "All Sales Team", url: "/super-admin/sales-team" },
          { title: "Sales Performance", url: "/super-admin/sales/performance" },
        ],
      },
      {
        title: "Users",
        url: "#",
        icon: Users,
        items: [
          { title: "All Users", url: "/super-admin/users" },
          { title: "Roles & Permissions", url: "/super-admin/users/roles" },
        ],
      },
    ],

    // 4. MARKETING & CONTENT SECTION
    navMarketing: [
      {
        title: "Articles / Blog",
        url: "#",
        icon: FileText,
        items: [
          { title: "All Articles", url: "/admin-article/article" },
          { title: "Categories", url: "/admin-article/categories" },
          { title: "Banners", url: "/admin-article/banners" },
          { title: "Tags", url: "/admin-article/tags" },
        ],
      },
      {
        title: "Web Content",
        url: "#",
        icon: LayoutTemplate,
        items: [
          { title: "Hero Images", url: "/super-admin/content/heros" },
          { title: "Banner Pop-Up", url: "/super-admin/content/banner-popup" },
          {
            title: "Banner Products",
            url: "/super-admin/content/banner-products",
          },
          { title: "Brand Client", url: "/super-admin/content/client-logo" },
          {
            title: "Testimonials & Photos",
            url: "/super-admin/content/testimonials",
          },
          { title: "Faqs", url: "/super-admin/content/faqs" },
          {
            title: "Best Price Guarantee",
            url: "/super-admin/content/best-price-guarantee",
          },
          { title: "Policies", url: "/super-admin/content/policies" },
          { title: "Portfolios", url: "/super-admin/content/portfolios" },
          {
            title: "Event Categories",
            url: "/super-admin/content/event-categories",
          },
          {
            title: "Success Stories",
            url: "/super-admin/content/sucess-stories",
          },
        ],
      },
      {
        title: "Marketing Campaigns",
        url: "#",
        icon: Megaphone,
        items: [
          { title: "Campaigns", url: "/super-admin/marketing/campaigns" },
          {
            title: "Contact Message Client",
            url: "/super-admin/contact-messages",
          },
        ],
      },
    ],

    // 5. WA PORTAL SECTION
    navWaPortal: [
      {
        title: "WA Portal",
        url: "#",
        icon: MessageSquare,
        items: [
          { title: "Live Chat Inbox", url: "/super-admin/wa-portal/live-chat" },
          { title: "Dashboard & Sessions", url: "/super-admin/wa-portal" },
          { title: "Send Message", url: "/super-admin/wa-portal?tab=send" },
          {
            title: "Scheduled Messages",
            url: "/super-admin/wa-portal?tab=schedule",
          },
          {
            title: "Message Logs & Audit",
            url: "/super-admin/wa-portal?tab=logs",
          },
          { title: "Webhooks", url: "/super-admin/wa-portal?tab=webhooks" },
        ],
      },
    ],

    // OTHER
    Etc: [
      {
        name: "Settings",
        url: "/super-admin/settings",
        icon: Settings,
      },
      {
        name: "Purchase Channel",
        url: "/super-admin/purchase-channel",
        icon: LucideChartNetwork,
      },
    ],
    dashboard: [{ name: "Main Dashboard", url: "/dashboard", icon: Frame }],
  };

  // === FUNGSI FILTER OTOMATIS BERDASARKAN URL ===
  const getVisibleItems = (items: any[]) => {
    return items.filter((group) => {
      // Ambil URL pertama dari sub-item di dalam grup menu
      const firstSubUrl = group.items?.[0]?.url || group.url;
      const inferredPermission = getPermissionFromMenuUrl(firstSubUrl);

      if (inferredPermission) {
        return checkPermission(userPermissions, inferredPermission, role);
      }
      return true;
    });
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        {/* Main Dashboard */}
        {role === "SUPER_ADMIN" && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Main Dashboard">
                  <Link href="/super-admin/">
                    <Frame />
                    <span>Main Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* -- SECTION DINAMIS -- */}
        {getVisibleItems(data.navOrder).length > 0 && (
          <NavMain
            label="Order Management"
            items={getVisibleItems(data.navOrder)}
          />
        )}

        {getVisibleItems(data.navDatabase).length > 0 && (
          <NavMain label="Database" items={getVisibleItems(data.navDatabase)} />
        )}

        {getVisibleItems(data.navUserManagement).length > 0 && (
          <NavMain
            label="User Management"
            items={getVisibleItems(data.navUserManagement)}
          />
        )}

        {getVisibleItems(data.navMarketing).length > 0 && (
          <NavMain
            label="Marketing & Content"
            items={getVisibleItems(data.navMarketing)}
          />
        )}

        {getVisibleItems(data.navWaPortal).length > 0 && (
          <NavMain
            label="WA Portal"
            items={getVisibleItems(data.navWaPortal)}
          />
        )}

        {/* -- SECTION ETC -- */}
        {(() => {
          const etcItems = data.Etc.filter((item) => {
            const inferredPermission = getPermissionFromMenuUrl(item.url);
            if (inferredPermission) {
              return checkPermission(userPermissions, inferredPermission, role);
            }
            return true;
          });

          return etcItems.length > 0 ? (
            <SidebarGroup>
              <SidebarMenu>
                {etcItems.map((item, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton asChild tooltip={item.name}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>
                          <span>{item.name}</span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ) : null;
        })()}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
