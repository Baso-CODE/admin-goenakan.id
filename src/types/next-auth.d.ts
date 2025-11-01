import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "SUPER_ADMIN" | "ADMIN_INVOICE" | "ADMIN_ARTICLE";
    };
  }
  interface User {
    role: "SUPER_ADMIN" | "ADMIN_INVOICE" | "ADMIN_ARTICLE";
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    
    role: "SUPER_ADMIN" | "ADMIN_INVOICE" | "ADMIN_ARTICLE";


  }
}
