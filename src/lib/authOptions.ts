import { sign } from "jsonwebtoken";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { comparePassword } from "./argon";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "me@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.trim(),
          },
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          throw new Error("Email tidak ditemukan");
        }

        if (!user.role) {
          throw new Error("Role user tidak ditemukan");
        }

        const isValid = await comparePassword(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          throw new Error("Password salah");
        }

        const roleName = user.role.name;

        if (roleName === "CUSTOMER") {
          throw new Error(
            "Akses ditolak: Akun customer tidak diizinkan masuk ke panel admin.",
          );
        }

        const permissions = user.role.permissions.map(
          (permission) => permission.name,
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: roleName,
          roleId: user.roleId,
          permissions,
          permissionVersion: user.role.permissionVersion,
        };
      },
    }),
  ],

  callbacks: {
    // ==========================================
    // JWT CALLBACK
    // ==========================================
    async jwt({ token, user }) {
      // LOGIN PERTAMA
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.roleId = user.roleId;
        token.permissions = user.permissions;
        token.permissionVersion = user.permissionVersion;

        // Jangan simpan JWT API di cookie NextAuth.
        // JWT API dibuat melalui session callback.
        token.accessToken = "";

        return token;
      }

      // TOKEN TIDAK VALID
      if (!token.id) {
        token.accessToken = "";
        return token;
      }

      // ==========================================
      // REFRESH USER & ROLE DARI DATABASE
      // ==========================================
      const currentUser = await prisma.user.findUnique({
        where: {
          id: token.id,
        },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!currentUser || !currentUser.role) {
        token.role = "CUSTOMER";
        token.roleId = "";
        token.permissions = [];
        token.permissionVersion = 0;
        token.accessToken = "";

        return token;
      }

      const roleName = currentUser.role.name;

      const permissions = currentUser.role.permissions.map(
        (permission) => permission.name,
      );

      // ==========================================
      // SINKRONISASI DATA JWT NEXTAUTH
      // ==========================================
      token.id = currentUser.id;
      token.name = currentUser.name;
      token.email = currentUser.email;
      token.role = roleName;
      token.roleId = currentUser.roleId;
      token.permissions = permissions;
      token.permissionVersion = currentUser.role.permissionVersion;

      // PENTING:
      // Tidak membuat JWT API di sini.
      // Menghindari JWT bersarang dalam cookie.
      token.accessToken = "";

      return token;
    },

    // ==========================================
    // SESSION CALLBACK
    // ==========================================
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;

      session.user.role = token.role;
      session.user.roleId = token.roleId;

      session.user.permissions = Array.isArray(token.permissions)
        ? token.permissions
        : [];

      session.user.permissionVersion = token.permissionVersion;

      // ==========================================
      // VALIDASI SESSION ADMIN
      // ==========================================
      const isValidAdmin =
        Boolean(token.id) &&
        Boolean(token.roleId) &&
        Boolean(token.role) &&
        token.role !== "CUSTOMER" &&
        typeof token.permissionVersion === "number";

      if (!isValidAdmin) {
        session.user.accessToken = "";
        return session;
      }

      // ==========================================
      // GENERATE API ACCESS TOKEN
      // ==========================================
      // Token API hanya dimasukkan ke response
      // session, bukan cookie NextAuth.
      session.user.accessToken = createAccessToken({
        id: token.id,
        email: token.email,
        role: token.role,
        roleId: token.roleId,
        permissions: session.user.permissions,
        permissionVersion: token.permissionVersion,
      });

      return session;
    },
  },

  // ==========================================
  // SESSION CONFIGURATION
  // ==========================================
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// ==========================================
// CREATE BACKEND API ACCESS TOKEN
// ==========================================
function createAccessToken({
  id,
  email,
  role,
  roleId,
  permissions,
  permissionVersion,
}: {
  id: string;
  email?: string | null;
  role: string;
  roleId: string;
  permissions: string[];
  permissionVersion: number;
}) {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET belum dikonfigurasi.");
  }

  return sign(
    {
      id,
      email,
      role,
      roleId,
      permissions,
      permissionVersion,
    },
    secret,
    {
      expiresIn: "7d",
    },
  );
}
