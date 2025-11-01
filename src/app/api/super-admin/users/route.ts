import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/argon";

// Definisikan Tipe Role yang sesuai dengan Prisma
type Role = "SUPER_ADMIN" | "ADMIN_ARTICLE" | "ADMIN_INVOICE";

export async function POST(req: NextRequest) {
  // 1. OTORISASI: Cek Sesi dan Role User
  const session = await getServerSession(authOptions);

  // Cek apakah ada sesi dan apakah role user adalah SUPER_ADMIN
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Access Denied. Only SUPER_ADMIN can create new users." },
      { status: 403 }
    );
  }

  try {
    const {
      name,
      email,
      password,
      role,
    }: { name: string; email: string; password: string; role: Role } =
      await req.json();

    // 2. VALIDASI DATA DASAR
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Cek format email dan panjang password (bisa menggunakan Zod lagi di backend)
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // 3. CEK USER DUPLIKAT
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists." },
        { status: 409 } // Conflict
      );
    }

    // 4. HASH PASSWORD
    const hashedPassword = await hashPassword(password);

    // 5. BUAT USER BARU
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // Simpan password yang sudah di-hash
        role: role, // Role harus berupa nilai dari enum Role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error." },
      { status: 500 }
    );
  }
}
