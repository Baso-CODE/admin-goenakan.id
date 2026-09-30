export type AdminRoute = {
  title: string;
  url: string;
  permission?: string;
  superAdminOnly?: boolean;
  defaultPriority?: number;
  section:
    | "Dashboard"
    | "Order Management"
    | "Database"
    | "User Management"
    | "Marketing & Content"
    | "WA Portal"
    | "Other";
  group: string;
};

export const ADMIN_ROUTES: AdminRoute[] = [
  {
    title: "Main Dashboard",
    url: "/super-admin",
    superAdminOnly: true,
    defaultPriority: 1,
    section: "Dashboard",
    group: "Dashboard",
  },

  // ORDER MANAGEMENT
  {
    title: "All Orders List",
    url: "/super-admin/orders",
    permission: "read_order",
    defaultPriority: 10,
    section: "Order Management",
    group: "Orders & Dashboard",
  },
  {
    title: "Sample History",
    url: "/super-admin/sample-history",
    permission: "read_sample_history",
    defaultPriority: 11,
    section: "Order Management",
    group: "Orders & Dashboard",
  },

  {
    title: "Invoices",
    url: "/admin-invoice/invoices",
    permission: "read_invoice",
    defaultPriority: 20,
    section: "Order Management",
    group: "Cashflow & Invoicing",
  },
  {
    title: "Invoice Notes",
    url: "/admin-invoice/notes",
    permission: "read_invoice_note",
    defaultPriority: 21,
    section: "Order Management",
    group: "Cashflow & Invoicing",
  },
  {
    title: "Cashflow",
    url: "/super-admin/cashflow",
    permission: "read_cashflow",
    defaultPriority: 22,
    section: "Order Management",
    group: "Cashflow & Invoicing",
  },
  {
    title: "Finance",
    url: "/super-admin/finance",
    permission: "read_finance",
    defaultPriority: 23,
    section: "Order Management",
    group: "Cashflow & Invoicing",
  },
  {
    title: "Currency",
    url: "/admin-invoice/currency",
    permission: "read_currency",
    defaultPriority: 24,
    section: "Order Management",
    group: "Cashflow & Invoicing",
  },

  {
    title: "Tracking Dashboard",
    url: "/super-admin/logistics",
    permission: "read_logistic",
    defaultPriority: 30,
    section: "Order Management",
    group: "Logistic & Delivery",
  },
  {
    title: "Delivery Notes",
    url: "/super-admin/logistics/shipment-notes",
    permission: "read_shipment_note_category",
    defaultPriority: 31,
    section: "Order Management",
    group: "Logistic & Delivery",
  },

  {
    title: "Quotations",
    url: "/admin-invoice/quotations",
    permission: "read_quotation",
    defaultPriority: 40,
    section: "Order Management",
    group: "Quotation & Follow Up",
  },
  {
    title: "Quotation Notes",
    url: "/admin-invoice/quotations/notes",
    permission: "read_quotation_note_category",
    defaultPriority: 41,
    section: "Order Management",
    group: "Quotation & Follow Up",
  },
  {
    title: "Follow Up Tracking",
    url: "/admin-invoice/quotations/follow-up",
    permission: "read_quotation",
    defaultPriority: 42,
    section: "Order Management",
    group: "Quotation & Follow Up",
  },

  {
    title: "All Purchase Orders",
    url: "/super-admin/purchase-orders",
    permission: "read_purchase_order",
    defaultPriority: 50,
    section: "Order Management",
    group: "Purchase Orders",
  },
  {
    title: "Replacement Orders",
    url: "/super-admin/replacement-orders",
    permission: "read_replacement_order",
    defaultPriority: 51,
    section: "Order Management",
    group: "Purchase Orders",
  },

  // DATABASE
  {
    title: "Vendors",
    url: "/super-admin/vendors",
    permission: "read_vendor",
    defaultPriority: 100,
    section: "Database",
    group: "Vendor Management",
  },
  {
    title: "Vendor Items",
    url: "/super-admin/vendor-items",
    permission: "read_vendor_item",
    defaultPriority: 101,
    section: "Database",
    group: "Vendor Management",
  },
  {
    title: "Vendor Categories",
    url: "/super-admin/vendor-categories",
    permission: "read_vendor_category",
    defaultPriority: 102,
    section: "Database",
    group: "Vendor Management",
  },
  {
    title: "Contact Platform",
    url: "/super-admin/contact-platforms",
    permission: "read_contact_platform",
    defaultPriority: 103,
    section: "Database",
    group: "Vendor Management",
  },

  {
    title: "All Client",
    url: "/super-admin/clients",
    permission: "read_client",
    defaultPriority: 110,
    section: "Database",
    group: "Client Management",
  },
  {
    title: "Departments",
    url: "/super-admin/departments",
    permission: "read_department",
    defaultPriority: 111,
    section: "Database",
    group: "Client Management",
  },

  {
    title: "Products",
    url: "/super-admin/products",
    permission: "read_product",
    defaultPriority: 120,
    section: "Database",
    group: "Product Management",
  },
  {
    title: "Product Categories",
    url: "/super-admin/product-categories",
    permission: "read_product_category",
    defaultPriority: 121,
    section: "Database",
    group: "Product Management",
  },
  {
    title: "Category Items",
    url: "/super-admin/item-categories-product",
    permission: "read_item_category",
    defaultPriority: 122,
    section: "Database",
    group: "Product Management",
  },
  {
    title: "Item Names",
    url: "/super-admin/item-names-product",
    permission: "read_item_name",
    defaultPriority: 123,
    section: "Database",
    group: "Product Management",
  },
  {
    title: "Product Materials",
    url: "/super-admin/product-materials",
    permission: "read_material_type",
    defaultPriority: 124,
    section: "Database",
    group: "Product Management",
  },
  {
    title: "Product Tags",
    url: "/super-admin/product-tags",
    permission: "read_product_tag",
    defaultPriority: 125,
    section: "Database",
    group: "Product Management",
  },
  {
    title: "Product Attributes",
    url: "/super-admin/product-attributes",
    permission: "read_product_attribute",
    defaultPriority: 126,
    section: "Database",
    group: "Product Management",
  },

  {
    title: "COGS Calculator",
    url: "/super-admin/supplier-cogs",
    permission: "read_supplier_cogs",
    defaultPriority: 130,
    section: "Database",
    group: "Supplier COGS",
  },
  {
    title: "Master Pricing",
    url: "/super-admin/master-pricing",
    permission: "read_supplier_cogs",
    defaultPriority: 131,
    section: "Database",
    group: "Supplier COGS",
  },

  // USER MANAGEMENT
  {
    title: "All Sales Team",
    url: "/super-admin/sales-team",
    permission: "read_sales",
    defaultPriority: 200,
    section: "User Management",
    group: "Sales Team",
  },
  {
    title: "Sales Overview",
    url: "/super-admin/sales",
    permission: "read_sales",
    defaultPriority: 201,
    section: "User Management",
    group: "Sales Team",
  },

  {
    title: "All Users",
    url: "/super-admin/users",
    permission: "read_user",
    defaultPriority: 210,
    section: "User Management",
    group: "Users",
  },
  {
    title: "Roles & Permissions",
    url: "/super-admin/users/roles",
    superAdminOnly: true,
    section: "User Management",
    group: "Users",
  },

  // MARKETING & CONTENT
  {
    title: "All Articles",
    url: "/admin-article/article",
    permission: "read_article",
    defaultPriority: 300,
    section: "Marketing & Content",
    group: "Articles / Blog",
  },
  {
    title: "Categories",
    url: "/admin-article/categories",
    permission: "read_article_category",
    defaultPriority: 301,
    section: "Marketing & Content",
    group: "Articles / Blog",
  },
  {
    title: "Banners",
    url: "/admin-article/banners",
    permission: "read_article_banner",
    defaultPriority: 302,
    section: "Marketing & Content",
    group: "Articles / Blog",
  },
  {
    title: "Tags",
    url: "/admin-article/tags",
    permission: "read_article",
    defaultPriority: 303,
    section: "Marketing & Content",
    group: "Articles / Blog",
  },
  {
    title: "Success Stories",
    url: "/super-admin/content/sucess-stories",
    permission: "read_success_story",
    defaultPriority: 304,
    section: "Marketing & Content",
    group: "Articles / Blog",
  },

  {
    title: "Hero Images",
    url: "/super-admin/content/heros",
    permission: "read_hero",
    defaultPriority: 310,
    section: "Marketing & Content",
    group: "Web Content",
  },
  {
    title: "Banner Pop-Up",
    url: "/super-admin/content/banner-popup",
    permission: "read_popup_banner",
    defaultPriority: 311,
    section: "Marketing & Content",
    group: "Web Content",
  },
  {
    title: "Banner Products",
    url: "/super-admin/content/banner-products",
    permission: "read_banner_product",
    defaultPriority: 312,
    section: "Marketing & Content",
    group: "Web Content",
  },
  {
    title: "Brand Client",
    url: "/super-admin/content/client-logo",
    permission: "read_client_logo",
    defaultPriority: 313,
    section: "Marketing & Content",
    group: "Web Content",
  },
  {
    title: "Testimonials & Photos",
    url: "/super-admin/content/testimonials",
    permission: "read_portfolio",
    defaultPriority: 314,
    section: "Marketing & Content",
    group: "Web Content",
  },
  {
    title: "Faqs",
    url: "/super-admin/content/faqs",
    permission: "read_faq",
    defaultPriority: 315,
    section: "Marketing & Content",
    group: "Web Content",
  },
  {
    title: "Best Price Guarantee",
    url: "/super-admin/content/best-price-guarantee",
    permission: "read_best_price_guarantee",
    defaultPriority: 316,
    section: "Marketing & Content",
    group: "Web Content",
  },
  {
    title: "Policies",
    url: "/super-admin/content/policies",
    permission: "read_policy",
    defaultPriority: 317,
    section: "Marketing & Content",
    group: "Web Content",
  },
  {
    title: "Portfolios",
    url: "/super-admin/content/portfolios",
    permission: "read_portfolio",
    defaultPriority: 318,
    section: "Marketing & Content",
    group: "Web Content",
  },
  {
    title: "Event Categories",
    url: "/super-admin/content/event-categories",
    permission: "read_event_category",
    defaultPriority: 319,
    section: "Marketing & Content",
    group: "Web Content",
  },

  {
    title: "Contact Message Client",
    url: "/super-admin/contact-messages",
    permission: "read_contact_message",
    defaultPriority: 330,
    section: "Marketing & Content",
    group: "Marketing Campaigns",
  },

  // WA PORTAL
  {
    title: "Live Chat Inbox",
    url: "/super-admin/wa-portal/live-chat",
    superAdminOnly: true,
    section: "WA Portal",
    group: "WA Portal",
  },
  {
    title: "Dashboard & Sessions",
    url: "/super-admin/wa-portal",
    superAdminOnly: true,
    section: "WA Portal",
    group: "WA Portal",
  },

  // OTHER
  {
    title: "Purchase Channel",
    url: "/super-admin/purchase-channel",
    permission: "read_purchase_channel",
    defaultPriority: 400,
    section: "Other",
    group: "Other",
  },
  {
    title: "Settings",
    url: "/super-admin/settings",
    permission: "read_app_setting",
    defaultPriority: 401,
    section: "Other",
    group: "Other",
  },
];
