import "next-auth";
import "next-auth/jwt";

// Hapus import type { Role } dari "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string; // 👈 Ubah menjadi string
      accessToken: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string; // 👈 Ubah menjadi string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string; // 👈 Ubah menjadi string
    accessToken: string;
  }
}
