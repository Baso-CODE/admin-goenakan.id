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
        email: { label: "Email", type: "email", placeholder: "me@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi");
        }

        // 1. Cari user beserta data role dan permissions dari database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
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

        // 2. Validasi kecocokan password
        const isValid = await comparePassword(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          throw new Error("Password salah");
        }

        // Ambil nama role user (default ke "CUSTOMER" jika tidak ada relasi role)
        const roleName = user.role?.name || "CUSTOMER";

        //  3. PENCEGAHAN: Blokir jika rolenya adalah CUSTOMER
        if (roleName === "CUSTOMER") {
          throw new Error(
            "Akses ditolak: Akun customer tidak diizinkan masuk ke panel admin.",
          );
        }

        const userPermissions =
          user.role?.permissions?.map((p) => p.name) || [];

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: roleName,
          roleId: user.roleId,
          permissions: userPermissions,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roleId = user.roleId;
        token.permissions = user.permissions;

        token.accessToken = sign(
          {
            id: user.id,
            email: user.email,
            role: user.role,
            roleId: user.roleId,
            permissions: user.permissions,
          },
          process.env.NEXTAUTH_SECRET!,
          { expiresIn: "7d" },
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roleId = token.roleId as string;
        (session.user as any).permissions = token.permissions;
        session.user.accessToken = token.accessToken as string;
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
