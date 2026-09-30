export type PermissionModuleConfig = {
  module: string;
  label: string;
  description?: string;
};

export type PermissionGroupConfig = {
  title: string;
  description: string;
  modules: PermissionModuleConfig[];
};

export const PERMISSION_GROUPS: PermissionGroupConfig[] = [
  {
    title: "Order Management",
    description:
      "Order, invoice, quotation, finance, dan operasional pengiriman.",
    modules: [
      {
        module: "order",
        label: "Orders",
      },
      {
        module: "sample_history",
        label: "Sample History",
      },
      {
        module: "invoice",
        label: "Invoices",
      },
      {
        module: "invoice_note",
        label: "Invoice Notes",
      },
      {
        module: "cashflow",
        label: "Cashflow",
      },
      {
        module: "finance",
        label: "Finance",
      },
      {
        module: "currency",
        label: "Currency",
      },
      {
        module: "logistic",
        label: "Logistics",
      },
      {
        module: "shipment_note_category",
        label: "Shipment Notes",
      },
      {
        module: "quotation",
        label: "Quotations",
      },
      {
        module: "quotation_note_category",
        label: "Quotation Notes",
      },
      {
        module: "purchase_order",
        label: "Purchase Orders",
      },
      {
        module: "replacement_order",
        label: "Replacement Orders",
      },
    ],
  },

  {
    title: "Database",
    description:
      "Master data vendor, client, produk, harga, dan konfigurasi produk.",
    modules: [
      {
        module: "vendor",
        label: "Vendors",
      },
      {
        module: "vendor_item",
        label: "Vendor Items",
      },
      {
        module: "vendor_category",
        label: "Vendor Categories",
      },
      {
        module: "contact_platform",
        label: "Contact Platforms",
      },
      {
        module: "client",
        label: "Clients",
      },
      {
        module: "department",
        label: "Departments",
      },
      {
        module: "product",
        label: "Products",
      },
      {
        module: "product_category",
        label: "Product Categories",
      },
      {
        module: "product_attribute",
        label: "Product Attributes",
      },
      {
        module: "product_tag",
        label: "Product Tags",
      },
      {
        module: "item_category",
        label: "Item Categories",
      },
      {
        module: "item_name",
        label: "Item Names",
      },
      {
        module: "material_type",
        label: "Material Types",
      },
      {
        module: "supplier_cogs",
        label: "Supplier COGS",
      },
      {
        module: "purchase_channel",
        label: "Purchase Channels",
      },
    ],
  },

  {
    title: "User Management",
    description: "Pengelolaan user, sales, dan data administratif internal.",
    modules: [
      {
        module: "sales",
        label: "Sales",
      },
      {
        module: "user",
        label: "Users",
      },
    ],
  },

  {
    title: "Marketing & Content",
    description:
      "Artikel, landing content, banner, portfolio, FAQ, dan konten website.",
    modules: [
      {
        module: "article",
        label: "Articles",
      },
      {
        module: "article_category",
        label: "Article Categories",
      },
      {
        module: "article_banner",
        label: "Article Banners",
      },
      {
        module: "article_seo",
        label: "Article SEO",
      },
      {
        module: "success_story",
        label: "Success Stories",
      },
      {
        module: "hero",
        label: "Hero",
      },
      {
        module: "popup_banner",
        label: "Popup Banner",
      },
      {
        module: "banner_product",
        label: "Banner Products",
      },
      {
        module: "brand_client",
        label: "Brand Clients",
      },
      {
        module: "client_logo",
        label: "Client Logos",
      },
      {
        module: "faq",
        label: "FAQs",
      },
      {
        module: "best_price_guarantee",
        label: "Best Price Guarantee",
      },
      {
        module: "policy",
        label: "Policies",
      },
      {
        module: "portfolio",
        label: "Portfolios",
      },
      {
        module: "event_category",
        label: "Event Categories",
      },
      {
        module: "contact_message",
        label: "Contact Messages",
      },
    ],
  },

  {
    title: "System",
    description: "Konfigurasi dan fitur sistem internal.",
    modules: [
      {
        module: "analytics",
        label: "Analytics",
      },
      {
        module: "app_setting",
        label: "Application Settings",
      },
    ],
  },
];
