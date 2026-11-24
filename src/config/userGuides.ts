export type GuideModule =
  | "invoice"
  | "quotation"
  | "signature"
  | "user"
  | "role";

export type UserGuide = {
  id: string;
  module: GuideModule;
  title: string;
  description: string;
  steps: string[];
  tips?: string[];
  warnings?: string[];
  permissions?: string[];
  roles?: string[];
  superAdminOnly?: boolean;
};

export const GUIDE_MODULES: Record<
  GuideModule,
  {
    title: string;
    description: string;
    href: string;
  }
> = {
  invoice: {
    title: "Invoice Management",
    description:
      "Pembuatan tagihan, pembayaran, penandatangan, dan pencetakan Invoice.",
    href: "/admin-invoice/invoices",
  },

  quotation: {
    title: "Quotation Management",
    description: "Pembuatan dan pengelolaan penawaran harga kepada client.",
    href: "/admin-invoice/quotations",
  },

  signature: {
    title: "Account & Signature",
    description: "Pengaturan tanda tangan pribadi untuk dokumen perusahaan.",
    href: "/account/signature",
  },

  user: {
    title: "User Management",
    description: "Pengelolaan akun administrator dan undangan aktivasi.",
    href: "/super-admin/users",
  },

  role: {
    title: "Roles & Permissions",
    description: "Pengaturan role serta hak akses administrator.",
    href: "/super-admin/users/roles",
  },
};

export const USER_GUIDES: UserGuide[] = [
  // ==========================================
  // INVOICE MANAGEMENT
  // ==========================================
  {
    id: "invoice-create",
    module: "invoice",
    title: "Cara Membuat Invoice",
    description: "Membuat Invoice berdasarkan Order yang sudah terdaftar.",
    permissions: ["read_order", "read_invoice", "create_invoice"],
    steps: [
      "Buka menu All Orders List.",
      "Cari Order yang akan dibuatkan Invoice.",
      "Buka halaman detail Order.",
      "Periksa ringkasan keuangan dan Remaining to Invoice.",
      "Klik tombol pembuatan Invoice pada bagian Financial Summary.",
      "Pilih metode penagihan Standard atau Partial Quantity.",
      "Pilih jenis tagihan dan masukkan nominal atau jumlah produk sesuai kebutuhan.",
      "Tambahkan catatan Invoice apabila diperlukan.",
      "Periksa kembali Current Amount Due dan estimasi sisa tagihan.",
      "Klik Buat Invoice.",
      "Buka Invoice yang berhasil dibuat melalui riwayat Invoice atau menu Invoices.",
    ],
    warnings: [
      "Membuat Invoice tidak otomatis mencatat pembayaran.",
      "Pastikan nominal tagihan tidak melebihi sisa tagihan Order.",
    ],
  },

  {
    id: "invoice-full-payment",
    module: "invoice",
    title: "Cara Membuat Invoice Full Payment",
    description: "Membuat satu Invoice untuk seluruh nilai tagihan Order.",
    permissions: ["read_order", "read_invoice", "create_invoice"],
    steps: [
      "Buka detail Order yang belum memiliki tagihan aktif.",
      "Buka dialog Generate Invoice.",
      "Pilih metode Standard.",
      "Pilih jenis tagihan Full Payment.",
      "Periksa nominal Invoice dan catatan.",
      "Klik Buat Invoice.",
    ],
    tips: [
      "Gunakan Full Payment apabila seluruh tagihan akan ditagihkan sekaligus.",
      "Status Invoice tidak otomatis menjadi PAID.",
    ],
  },

  {
    id: "invoice-dp",
    module: "invoice",
    title: "Cara Membuat Invoice Down Payment (DP)",
    description: "Membuat tagihan uang muka berdasarkan kesepakatan client.",
    permissions: ["read_order", "read_invoice", "create_invoice"],
    steps: [
      "Buka detail Order.",
      "Buka dialog Generate Invoice.",
      "Pilih metode Standard.",
      "Pilih Down Payment (DP).",
      "Tentukan perhitungan DP berdasarkan persentase atau nominal.",
      "Masukkan nilai DP sesuai kesepakatan.",
      "Periksa Current Amount Due dan sisa tagihan.",
      "Klik Buat Invoice.",
    ],
    warnings: [
      "Invoice DP merupakan tagihan uang muka, bukan bukti bahwa uang muka sudah diterima.",
    ],
  },

  {
    id: "invoice-installment",
    module: "invoice",
    title: "Cara Membuat Invoice Cicilan dan Pelunasan",
    description: "Membuat tagihan lanjutan untuk Order yang dibayar bertahap.",
    permissions: ["read_order", "read_invoice", "create_invoice"],
    steps: [
      "Buka detail Order.",
      "Periksa Invoice sebelumnya dan sisa tagihan.",
      "Buka dialog Generate Invoice.",
      "Pilih metode Standard.",
      "Pilih Cicilan Pertama atau Cicilan Berikutnya sesuai kondisi Order.",
      "Masukkan nominal cicilan.",
      "Untuk pelunasan sisa tagihan, pilih Balance Payment / Pelunasan apabila tersedia.",
      "Periksa ringkasan tagihan.",
      "Klik Buat Invoice.",
    ],
    warnings: [
      "Sisa yang belum ditagihkan berbeda dengan sisa pembayaran yang belum diterima.",
    ],
  },

  {
    id: "invoice-partial-quantity",
    module: "invoice",
    title: "Cara Membuat Invoice Partial Quantity",
    description:
      "Membuat tagihan berdasarkan jumlah produk tertentu dalam Order.",
    permissions: ["read_order", "read_invoice", "create_invoice"],
    steps: [
      "Buka detail Order.",
      "Buka dialog Generate Invoice.",
      "Pilih Partial Quantity.",
      "Pilih produk yang ingin ditagihkan.",
      "Masukkan jumlah produk sesuai kebutuhan penagihan.",
      "Pilih jenis tagihan yang tersedia.",
      "Periksa nominal dan kuantitas produk.",
      "Klik Buat Invoice.",
    ],
    warnings: [
      "Jangan menagihkan jumlah produk melebihi kuantitas yang tersedia.",
      "Ikuti metode penagihan yang sudah digunakan pada Invoice sebelumnya.",
    ],
  },

  {
    id: "invoice-payment",
    module: "invoice",
    title: "Cara Update Status Pembayaran Invoice",
    description: "Mencatat pembayaran Invoice yang telah diterima.",
    permissions: ["read_invoice", "create_invoice"],
    steps: [
      "Buka menu Invoices.",
      "Cari Invoice berdasarkan nomor Invoice atau Order.",
      "Buka Detail Invoice.",
      "Pastikan status Invoice adalah UNPAID atau OVERDUE.",
      "Pastikan dana benar-benar sudah diterima.",
      "Klik Mark as Paid.",
      "Isi tanggal pembayaran.",
      "Pilih metode pembayaran.",
      "Konfirmasi pembayaran.",
      "Pastikan status Invoice berubah menjadi PAID.",
    ],
    warnings: [
      "Jangan menandai Invoice sebagai PAID jika dana belum diterima.",
      "Periksa nominal dan bukti pembayaran sebelum melakukan konfirmasi.",
    ],
  },

  {
    id: "invoice-change-signer",
    module: "invoice",
    title: "Cara Mengganti Penandatangan Invoice",
    description:
      "Mengalihkan nama dan tanda tangan Invoice kepada Admin Sales lain.",
    superAdminOnly: true,
    steps: [
      "Login sebagai Super Admin.",
      "Buka menu Invoices.",
      "Cari dan buka Detail Invoice.",
      "Klik Ganti Penandatangan.",
      "Pilih Admin Sales atau Super Admin yang memiliki tanda tangan.",
      "Periksa preview nama dan tanda tangan baru.",
      "Isi alasan penggantian minimal 10 karakter.",
      "Klik Simpan Penandatangan.",
      "Periksa kembali tampilan Invoice.",
      "Cetak ulang PDF apabila diperlukan.",
    ],
    tips: [
      "Identitas pembuat Invoice tidak berubah.",
      "Nominal dan status pembayaran tidak ikut berubah.",
      "Penggantian tercatat dalam audit log.",
    ],
    warnings: [
      "Invoice berstatus CANCELLED tidak dapat diganti penandatangannya.",
      "Untuk Invoice yang sudah dikirim, pastikan perubahan disetujui dan client menerima dokumen revisi.",
    ],
  },

  {
    id: "invoice-delete",
    module: "invoice",
    title: "Cara Menghapus Invoice",
    description: "Menghapus Invoice yang tidak lagi diperlukan.",
    permissions: ["read_invoice", "delete_invoice"],
    steps: [
      "Buka menu Invoices.",
      "Cari Invoice yang ingin dihapus.",
      "Periksa nomor dan status Invoice.",
      "Klik tombol Hapus Invoice.",
      "Baca informasi pada dialog konfirmasi.",
      "Konfirmasi penghapusan.",
      "Pastikan Invoice tidak lagi muncul pada daftar.",
    ],
    warnings: [
      "Invoice berstatus PAID tidak dapat dihapus.",
      "Invoice yang memiliki riwayat refund tidak dapat dihapus.",
      "Penghapusan bersifat permanen.",
    ],
  },

  {
    id: "invoice-print",
    module: "invoice",
    title: "Cara Print atau Download PDF Invoice",
    description: "Mencetak Invoice atau menyimpannya dalam format PDF.",
    permissions: ["read_invoice"],
    steps: [
      "Buka menu Invoices.",
      "Pilih Invoice yang ingin dicetak.",
      "Buka Detail Invoice.",
      "Periksa identitas client, nominal, produk, dan tanda tangan.",
      "Klik Print / Save PDF.",
      "Pilih printer atau Save as PDF pada dialog browser.",
      "Simpan dokumen.",
    ],
    tips: ["Periksa kembali hasil PDF sebelum dikirim kepada client."],
  },

  // ==========================================
  // QUOTATION MANAGEMENT
  // ==========================================
  {
    id: "quotation-create",
    module: "quotation",
    title: "Cara Membuat Quotation",
    description: "Membuat penawaran harga produk atau layanan kepada client.",
    permissions: ["read_quotation", "create_quotation"],
    steps: [
      "Buka menu Quotations.",
      "Klik Buat Penawaran.",
      "Pilih client dan PIC jika diperlukan.",
      "Isi tanggal dan masa berlaku penawaran.",
      "Pilih mata uang dan isi payment terms.",
      "Tambahkan produk beserta jumlah dan harga.",
      "Atur price tiers apabila diperlukan.",
      "Tambahkan catatan penawaran.",
      "Super Admin dapat memilih penandatangan. Admin Sales menggunakan identitas sendiri.",
      "Periksa kembali seluruh informasi.",
      "Simpan Quotation.",
    ],
    warnings: [
      "Pastikan harga, jumlah produk, mata uang, dan syarat pembayaran sesuai kesepakatan.",
    ],
  },

  {
    id: "quotation-update",
    module: "quotation",
    title: "Cara Edit Quotation",
    description: "Memperbarui informasi penawaran yang sudah dibuat.",
    permissions: ["read_quotation", "update_quotation"],
    steps: [
      "Buka menu Quotations.",
      "Cari Quotation berdasarkan nomor atau client.",
      "Buka menu tindakan dan pilih Edit.",
      "Perbarui informasi yang diperlukan.",
      "Periksa kembali produk, harga, catatan, dan total.",
      "Simpan perubahan.",
      "Buka Detail Quotation untuk memeriksa hasil.",
    ],
    warnings: [
      "Penggantian penandatangan tidak dilakukan melalui form Edit.",
      "Jika penawaran sudah diterima client, koordinasikan revisi terlebih dahulu.",
    ],
  },

  {
    id: "quotation-change-signer",
    module: "quotation",
    title: "Cara Mengganti Penandatangan Quotation",
    description:
      "Mengganti penandatangan dokumen tanpa mengubah pembuat Quotation.",
    superAdminOnly: true,
    steps: [
      "Login sebagai Super Admin.",
      "Buka menu Quotations.",
      "Cari Quotation yang ingin diperbarui.",
      "Pilih Detail.",
      "Klik Ganti Penandatangan.",
      "Pilih Admin Sales yang sudah memiliki tanda tangan.",
      "Periksa preview tanda tangan.",
      "Masukkan alasan penggantian minimal 10 karakter.",
      "Klik Simpan Penandatangan.",
      "Buka Print PDF untuk memeriksa hasil.",
    ],
    tips: [
      "Nama pembuat dan penandatangan adalah dua informasi yang berbeda.",
      "Perubahan tercatat dalam audit log Quotation.",
    ],
    warnings: [
      "Quotation berstatus CANCELLED tidak dapat diganti penandatangannya.",
    ],
  },

  {
    id: "quotation-delete",
    module: "quotation",
    title: "Cara Menghapus Quotation",
    description: "Menghapus penawaran yang tidak lagi digunakan.",
    permissions: ["read_quotation", "delete_quotation"],
    steps: [
      "Buka menu Quotations.",
      "Cari Quotation yang ingin dihapus.",
      "Buka Detail Quotation.",
      "Klik Hapus.",
      "Baca dialog konfirmasi.",
      "Pastikan dokumen yang dipilih benar.",
      "Konfirmasi penghapusan.",
    ],
    warnings: [
      "Penghapusan bersifat permanen.",
      "Jangan menghapus penawaran yang sudah disepakati tanpa persetujuan pihak terkait.",
    ],
  },

  {
    id: "quotation-print",
    module: "quotation",
    title: "Cara Print PDF Quotation",
    description: "Mencetak penawaran untuk dikirimkan kepada client.",
    permissions: ["read_quotation"],
    steps: [
      "Buka menu Quotations.",
      "Pilih penawaran yang akan dicetak.",
      "Buka Detail Quotation.",
      "Klik Print PDF.",
      "Periksa isi penawaran dan tanda tangan.",
      "Cetak atau simpan dokumen melalui dialog print browser.",
    ],
  },

  // ==========================================
  // ACCOUNT & SIGNATURE
  // ==========================================
  {
    id: "signature-upload",
    module: "signature",
    title: "Cara Upload dan Mengganti Tanda Tangan",
    description: "Mengelola tanda tangan pribadi untuk Invoice dan Quotation.",
    roles: ["SUPER_ADMIN", "ADMIN_SALES"],
    steps: [
      "Login menggunakan akun masing-masing.",
      "Klik profil pengguna pada bagian bawah sidebar.",
      "Pilih Tanda Tangan Saya.",
      "Klik Pilih Gambar.",
      "Pilih file tanda tangan PNG, JPG, atau WebP.",
      "Periksa preview tanda tangan.",
      "Klik Simpan Tanda Tangan.",
      "Pastikan status tanda tangan berhasil tersimpan.",
    ],
    tips: [
      "Gunakan PNG transparan untuk hasil cetak yang lebih rapi.",
      "Ukuran file maksimal 2 MB.",
    ],
    warnings: [
      "Gunakan tanda tangan sendiri yang sah dan berwenang digunakan.",
      "Perubahan tanda tangan profil tidak otomatis mengubah snapshot dokumen lama.",
    ],
  },

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  {
    id: "user-create",
    module: "user",
    title: "Cara Membuat Akun Admin Baru",
    description:
      "Mendaftarkan administrator dan mengirim undangan aktivasi akun.",
    superAdminOnly: true,
    steps: [
      "Login sebagai Super Admin.",
      "Buka menu All Users.",
      "Buka halaman tambah user.",
      "Isi nama dan email pengguna.",
      "Pilih role sesuai tanggung jawab pengguna.",
      "Simpan akun.",
      "Pastikan undangan aktivasi berhasil dikirim.",
      "Minta pengguna membuka email aktivasi dan membuat password sendiri.",
    ],
    tips: [
      "Untuk Admin Sales, gunakan role ADMIN_SALES.",
      "Jika undangan gagal diterima, gunakan fitur Kirim Ulang Undangan.",
    ],
    warnings: [
      "Jangan memberikan role SUPER_ADMIN tanpa kebutuhan yang jelas.",
      "Jangan meminta password pribadi pengguna.",
    ],
  },

  {
    id: "user-update",
    module: "user",
    title: "Cara Memperbarui Data dan Role User",
    description: "Memperbarui informasi akun administrator.",
    superAdminOnly: true,
    steps: [
      "Buka menu All Users.",
      "Cari pengguna yang ingin diperbarui.",
      "Klik tombol Edit.",
      "Perbarui informasi atau role pengguna.",
      "Periksa kembali role yang dipilih.",
      "Simpan perubahan.",
      "Pastikan pengguna mendapatkan akses sesuai role barunya.",
    ],
    warnings: ["Mengubah role dapat mengubah hak akses pengguna."],
  },

  // ==========================================
  // ROLES & PERMISSIONS
  // ==========================================
  {
    id: "role-create",
    module: "role",
    title: "Cara Membuat Role Baru",
    description: "Menambahkan kategori hak akses sesuai kebutuhan perusahaan.",
    superAdminOnly: true,
    steps: [
      "Buka menu Roles & Permissions.",
      "Klik Add Role.",
      "Masukkan nama role.",
      "Isi deskripsi tanggung jawab role.",
      "Simpan role.",
      "Lanjutkan ke halaman pengaturan permissions.",
      "Pilih permissions yang diperlukan.",
      "Simpan pengaturan hak akses.",
    ],
    warnings: [
      "Role baru perlu diberikan permissions agar dapat mengakses fitur.",
      "Hindari memberikan seluruh permissions kepada role biasa.",
    ],
  },

  {
    id: "role-permissions",
    module: "role",
    title: "Cara Mengatur Permissions",
    description:
      "Menentukan fitur dan tindakan yang dapat dilakukan oleh suatu role.",
    superAdminOnly: true,
    steps: [
      "Buka menu Roles & Permissions.",
      "Pilih role yang akan diatur.",
      "Klik Manage Permissions.",
      "Cari modul yang ingin diberikan akses.",
      "Centang permissions sesuai kebutuhan pekerjaan.",
      "Periksa kembali permissions yang dipilih.",
      "Simpan perubahan.",
      "Uji akses menggunakan akun dengan role tersebut.",
    ],
    warnings: [
      "Berikan hanya permissions yang diperlukan untuk pekerjaan pengguna.",
      "Permission Delete harus diberikan secara selektif.",
    ],
  },
];

// ==========================================
// ACCESS CONTROL
// ==========================================
export function getVisibleGuides(role: string, permissions: string[]) {
  if (!role || role === "CUSTOMER") {
    return [];
  }

  return USER_GUIDES.filter((guide) => {
    if (role === "SUPER_ADMIN") {
      return true;
    }

    if (guide.superAdminOnly) {
      return false;
    }

    if (guide.roles && !guide.roles.includes(role)) {
      return false;
    }

    if (guide.permissions?.length) {
      return guide.permissions.every((permission) =>
        permissions.includes(permission),
      );
    }

    return true;
  });
}

// ==========================================
// PAGE CONTEXT
// ==========================================
export function getGuideModuleByPath(pathname: string): GuideModule | null {
  const matches = (base: string) =>
    pathname === base || pathname.startsWith(`${base}/`);

  if (matches("/admin-invoice/invoices")) {
    return "invoice";
  }

  if (matches("/super-admin/orders")) {
    return "invoice";
  }

  if (
    matches("/admin-invoice/quotations/notes") ||
    matches("/admin-invoice/quotations/follow-up")
  ) {
    return null;
  }

  if (matches("/admin-invoice/quotations")) {
    return "quotation";
  }

  if (matches("/account/signature")) {
    return "signature";
  }

  if (matches("/super-admin/users/roles")) {
    return "role";
  }

  if (matches("/super-admin/users")) {
    return "user";
  }

  return null;
}
