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

// === ICONS ===
import { checkAccess } from "@/lib/roleAccess";
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

  // Ambil role langsung dari session (string)
  const role = (session?.user?.role as string) || "";

  // ... (Data Anda tetap sama seperti di atas) ...

  // === FUNGSI FILTER DINAMIS ===
  const getVisibleItems = (items: any[]) => {
    return items
      .map((group) => ({
        ...group,
        items: group.items?.filter((item: any) => checkAccess(role, item.url)),
      }))
      .filter((group) => group.items?.length > 0);
  };

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

    // 1. ORDER MANAGEMENT SECTION
    navOrder: [
      {
        title: "Orders & Dashboard",
        url: "#",
        icon: ListOrdered,
        items: [
          { title: "All Orders List", url: "/super-admin/orders" },
          {
            title: "Replacement Order",
            url: "/super-admin/replacement-orders",
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
        title: "Product Management V2",
        url: "#",
        icon: Package,
        items: [
          {
            title: "Products V2",
            url: "/super-admin/products-v2",
            icon: Package,
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
          {
            title: "Faqs",
            url: "/super-admin/content/faqs",
          },
          {
            title: "Best Price Guarantee",
            url: "/super-admin/content/best-price-guarantee",
          },
          {
            title: "Policies",
            url: "/super-admin/content/policies",
          },
          {
            title: "Portfolios",
            url: "/super-admin/content/portfolios",
          },
          {
            title: "Event Categories",
            url: "/super-admin/content/event-categories",
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

    // OTHER (PERBAIKAN DISINI)
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

  // === ROLE VISIBILITY LOGIC ===

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        {checkAccess(role, "/super-admin") && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Sales Dashboard">
                  <Link href="/super-admin">
                    <LucideChartNetwork />
                    <span>Sales Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* -- SECTION DINAMIS -- */}
        {(() => {
          const orderItems = getVisibleItems(data.navOrder);
          return orderItems.length > 0 ? (
            <NavMain label="Order Management" items={orderItems} />
          ) : null;
        })()}

        {(() => {
          const dbItems = getVisibleItems(data.navDatabase);
          return dbItems.length > 0 ? (
            <NavMain label="Database" items={dbItems} />
          ) : null;
        })()}

        {(() => {
          const userItems = getVisibleItems(data.navUserManagement);
          return userItems.length > 0 ? (
            <NavMain label="User Management" items={userItems} />
          ) : null;
        })()}

        {(() => {
          const marketingItems = getVisibleItems(data.navMarketing);
          return marketingItems.length > 0 ? (
            <NavMain label="Marketing & Content" items={marketingItems} />
          ) : null;
        })()}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
