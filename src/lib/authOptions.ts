import { sign } from "jsonwebtoken";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { comparePassword } from "./argon";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),

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

        // ✨ PERUBAHAN: Include relasi role dan permissions dari database
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

        const isValid = await comparePassword(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          throw new Error("Password salah");
        }

        const userPermissions =
          user.role?.permissions?.map((p) => p.name) || [];

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.name || "CUSTOMER",
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
