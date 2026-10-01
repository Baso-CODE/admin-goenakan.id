import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      roleId: string;
      permissions: string[];
      permissionVersion: number;
      accessToken: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    roleId: string;
    permissions: string[];
    permissionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    roleId: string;
    permissions: string[];
    permissionVersion: number;
    accessToken: string;
  }
}
