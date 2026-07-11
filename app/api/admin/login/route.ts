import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import { cookies } from "next/headers";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Auto-semillado de usuario admin/admin si la base de datos de usuarios está vacía
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const defaultPasswordHash = hashPassword("admin");
      await User.create({
        username: "admin",
        password: defaultPasswordHash,
      });
    }

    // Buscar al usuario
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Validar contraseña encriptada
    const inputHash = hashPassword(password);
    if (user.password !== inputHash) {
      return NextResponse.json(
        { success: false, error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Iniciar sesión y setear cookie HTTP-Only segura
    const cookieStore = await cookies();
    cookieStore.set("admin_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 días de sesión activa
      path: "/",
    });

    const isDefaultPassword = inputHash === hashPassword("admin");

    return NextResponse.json({
      success: true,
      message: "Login correcto",
      isDefaultPassword,
    });
  } catch (err: any) {
    console.error("Error en API de Login:", err);
    return NextResponse.json(
      { success: false, error: "Error en el servidor durante el login" },
      { status: 500 }
    );
  }
}
