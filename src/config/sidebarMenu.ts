export type SidebarMenuChild = {
  title: string;
  routeUrl: string;
  href?: string;
};

export type SidebarMenuGroup = {
  title: string;
  icon:
    | "orders"
    | "invoice"
    | "logistic"
    | "quotation"
    | "purchase"
    | "vendor"
    | "client"
    | "product"
    | "cogs"
    | "sales"
    | "users"
    | "article"
    | "content"
    | "marketing"
    | "whatsapp"
    | "settings";
  children: SidebarMenuChild[];
};

export type SidebarSection = {
  title: string;
  groups: SidebarMenuGroup[];
};

export const SIDEBAR_MENU: SidebarSection[] = [
  {
    title: "Order Management",
    groups: [
      {
        title: "Orders & Dashboard",
        icon: "orders",
        children: [
          {
            title: "All Orders List",
            routeUrl: "/super-admin/orders",
          },
          {
            title: "Sample History",
            routeUrl: "/super-admin/sample-history",
          },
        ],
      },
      {
        title: "Cashflow & Invoicing",
        icon: "invoice",
        children: [
          {
            title: "Invoices",
            routeUrl: "/admin-invoice/invoices",
          },
          {
            title: "Invoice Notes",
            routeUrl: "/admin-invoice/notes",
          },
          {
            title: "Cashflow",
            routeUrl: "/super-admin/cashflow",
          },
          {
            title: "Finance",
            routeUrl: "/super-admin/finance",
          },
          {
            title: "Currency",
            routeUrl: "/admin-invoice/currency",
          },
        ],
      },
      {
        title: "Logistic & Delivery",
        icon: "logistic",
        children: [
          {
            title: "Tracking Dashboard",
            routeUrl: "/super-admin/logistics",
          },
          {
            title: "Delivery Notes",
            routeUrl: "/super-admin/logistics/shipment-notes",
          },
        ],
      },
      {
        title: "Quotation & Follow Up",
        icon: "quotation",
        children: [
          {
            title: "Quotations",
            routeUrl: "/admin-invoice/quotations",
          },
          {
            title: "Quotation Notes",
            routeUrl: "/admin-invoice/quotations/notes",
          },
          {
            title: "Follow Up Tracking",
            routeUrl: "/admin-invoice/quotations/follow-up",
          },
        ],
      },
      {
        title: "Purchase Orders",
        icon: "purchase",
        children: [
          {
            title: "All Purchase Orders",
            routeUrl: "/super-admin/purchase-orders",
          },
          {
            title: "Replacement Orders",
            routeUrl: "/super-admin/replacement-orders",
          },
        ],
      },
    ],
  },

  {
    title: "Database",
    groups: [
      {
        title: "Vendor Management",
        icon: "vendor",
        children: [
          {
            title: "Vendors",
            routeUrl: "/super-admin/vendors",
          },
          {
            title: "Vendor Items",
            routeUrl: "/super-admin/vendor-items",
          },
          {
            title: "Vendor Categories",
            routeUrl: "/super-admin/vendor-categories",
          },
          {
            title: "Platform",
            routeUrl: "/super-admin/contact-platforms",
          },
        ],
      },
      {
        title: "Client Management",
        icon: "client",
        children: [
          {
            title: "All Client",
            routeUrl: "/super-admin/clients",
          },
          {
            title: "Departments",
            routeUrl: "/super-admin/departments",
          },
        ],
      },
      {
        title: "Product Management",
        icon: "product",
        children: [
          {
            title: "Products",
            routeUrl: "/super-admin/products",
          },
          {
            title: "Product Categories",
            routeUrl: "/super-admin/product-categories",
          },
          {
            title: "Category Items",
            routeUrl: "/super-admin/item-categories-product",
          },
          {
            title: "Item Names",
            routeUrl: "/super-admin/item-names-product",
          },
          {
            title: "Product Materials",
            routeUrl: "/super-admin/product-materials",
          },
          {
            title: "Product Tags",
            routeUrl: "/super-admin/product-tags",
          },
          {
            title: "Product Attributes",
            routeUrl: "/super-admin/product-attributes",
          },
        ],
      },
      {
        title: "Supplier COGS",
        icon: "cogs",
        children: [
          {
            title: "COGS Calculator",
            routeUrl: "/super-admin/supplier-cogs",
          },
          {
            title: "Master Pricing",
            routeUrl: "/super-admin/master-pricing",
          },
        ],
      },
    ],
  },

  {
    title: "User Management",
    groups: [
      {
        title: "Sales Team",
        icon: "sales",
        children: [
          {
            title: "All Sales Team",
            routeUrl: "/super-admin/sales-team",
          },
          {
            title: "Sales Overview",
            routeUrl: "/super-admin/sales",
          },
        ],
      },
      {
        title: "Users",
        icon: "users",
        children: [
          {
            title: "All Users",
            routeUrl: "/super-admin/users",
          },
          {
            title: "Roles & Permissions",
            routeUrl: "/super-admin/users/roles",
          },
        ],
      },
    ],
  },

  {
    title: "Marketing & Content",
    groups: [
      {
        title: "Articles / Blog",
        icon: "article",
        children: [
          {
            title: "All Articles",
            routeUrl: "/admin-article/article",
          },
          {
            title: "Categories",
            routeUrl: "/admin-article/categories",
          },
          {
            title: "Banners",
            routeUrl: "/admin-article/banners",
          },
          {
            title: "Tags",
            routeUrl: "/admin-article/tags",
          },
          {
            title: "Success Stories",
            routeUrl: "/super-admin/content/sucess-stories",
          },
        ],
      },
      {
        title: "Web Content",
        icon: "content",
        children: [
          {
            title: "Hero Images",
            routeUrl: "/super-admin/content/heros",
          },
          {
            title: "Banner Pop-Up",
            routeUrl: "/super-admin/content/banner-popup",
          },
          {
            title: "Banner Products",
            routeUrl: "/super-admin/content/banner-products",
          },
          {
            title: "Brand Client",
            routeUrl: "/super-admin/content/client-logo",
          },
          {
            title: "Testimonials & Photos",
            routeUrl: "/super-admin/content/testimonials",
          },
          {
            title: "Faqs",
            routeUrl: "/super-admin/content/faqs",
          },
          {
            title: "Best Price Guarantee",
            routeUrl: "/super-admin/content/best-price-guarantee",
          },
          {
            title: "Policies",
            routeUrl: "/super-admin/content/policies",
          },
          {
            title: "Portfolios",
            routeUrl: "/super-admin/content/portfolios",
          },
          {
            title: "Event Categories",
            routeUrl: "/super-admin/content/event-categories",
          },
        ],
      },
      {
        title: "Marketing Campaigns",
        icon: "marketing",
        children: [
          {
            title: "Contact Message Client",
            routeUrl: "/super-admin/contact-messages",
          },
        ],
      },
    ],
  },

  {
    title: "WA Portal",
    groups: [
      {
        title: "WA Portal",
        icon: "whatsapp",
        children: [
          {
            title: "Live Chat Inbox",
            routeUrl: "/super-admin/wa-portal",
            href: "/super-admin/wa-portal/live-chat",
          },
          {
            title: "Dashboard & Sessions",
            routeUrl: "/super-admin/wa-portal",
          },
          {
            title: "Send Message",
            routeUrl: "/super-admin/wa-portal",
            href: "/super-admin/wa-portal?tab=send",
          },
          {
            title: "Scheduled Messages",
            routeUrl: "/super-admin/wa-portal",
            href: "/super-admin/wa-portal?tab=schedule",
          },
          {
            title: "Message Logs & Audit",
            routeUrl: "/super-admin/wa-portal",
            href: "/super-admin/wa-portal?tab=logs",
          },
          {
            title: "Webhooks",
            routeUrl: "/super-admin/wa-portal",
            href: "/super-admin/wa-portal?tab=webhooks",
          },
        ],
      },
    ],
  },

  {
    title: "Other",
    groups: [
      {
        title: "Other",
        icon: "settings",
        children: [
          {
            title: "Purchase Channel",
            routeUrl: "/super-admin/purchase-channel",
          },
          {
            title: "Settings",
            routeUrl: "/super-admin/settings",
          },
        ],
      },
    ],
  },
];
