import { hashPassword } from "@/lib/argon";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // 1. OTORISASI: Cek Sesi dan Role User
  const session = await getServerSession(authOptions);

  // TypeScript sekarang sudah otomatis mengenali session.user.role sebagai string!
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { message: "Access Denied. Only SUPER_ADMIN can create new users." },
      { status: 403 },
    );
  }

  try {
    const { name, email, password, role } = await req.json();

    // 2. VALIDASI DATA DASAR
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    // 3. CEK USER DUPLIKAT
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists." },
        { status: 409 },
      );
    }

    // 4. HASH PASSWORD
    const hashedPassword = await hashPassword(password);

    // 5. BUAT USER BARU
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // PERUBAHAN: Gunakan connect untuk mengaitkan string nama role ke tabel Role
        role: {
          connect: { name: role },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        // PERUBAHAN: Karena role sekarang objek, kita pilih properti 'name'-nya saja
        // agar respon API tetap flat dan rapi seperti sebelumnya
        role: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
    });

    // Opsional: Meratakan struktur data balikan agar frontend tidak perlu mengubah kodenya
    const formattedUser = {
      ...newUser,
      role: newUser.role.name,
    };

    return NextResponse.json(formattedUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error." },
      { status: 500 },
    );
  }
}
