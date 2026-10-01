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
            email: credentials.email,
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
    async jwt({ token, user }) {
      /*
       * LOGIN PERTAMA
       */
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roleId = user.roleId;
        token.permissions = user.permissions;
        token.permissionVersion = user.permissionVersion;

        token.accessToken = createAccessToken({
          id: user.id,
          email: user.email,
          role: user.role,
          roleId: user.roleId,
          permissions: user.permissions,
          permissionVersion: user.permissionVersion,
        });

        return token;
      }

      /*
       * Tidak ada user ID di token.
       */
      if (!token.id) {
        return token;
      }

      /*
       * Ambil kondisi user + role terbaru dari database.
       *
       * Ini menangani:
       * - permission role berubah
       * - permissionVersion berubah
       * - user pindah role
       * - nama role berubah
       */
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

      const permissionVersion = currentUser.role.permissionVersion;

      /*
       * SELALU sinkronkan token NextAuth
       * dengan kondisi database terbaru.
       */
      token.role = roleName;
      token.roleId = currentUser.roleId;
      token.permissions = permissions;
      token.permissionVersion = permissionVersion;

      /*
       * SELALU buat access token API baru.
       *
       * Ini penting supaya accessToken tidak tertinggal
       * permissionVersion lama.
       */
      token.accessToken = createAccessToken({
        id: currentUser.id,
        email: currentUser.email,
        role: roleName,
        roleId: currentUser.roleId,
        permissions,
        permissionVersion,
      });

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.roleId = token.roleId;
        session.user.permissions = token.permissions || [];

        session.user.permissionVersion = token.permissionVersion;

        session.user.accessToken = token.accessToken;
      }

      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

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
  return sign(
    {
      id,
      email,
      role,
      roleId,
      permissions,
      permissionVersion,
    },
    process.env.NEXTAUTH_SECRET!,
    {
      expiresIn: "7d",
    },
  );
}
