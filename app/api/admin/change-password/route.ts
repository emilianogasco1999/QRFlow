import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth");
  return !!(authCookie && authCookie.value === "true");
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: "La nueva contraseña debe tener al menos 4 caracteres" },
        { status: 400 }
      );
    }

    // Buscar al usuario "admin" y actualizar su contraseña
    const adminUser = await User.findOne({ username: "admin" });
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Usuario administrador no encontrado" },
        { status: 404 }
      );
    }

    const hashedPassword = hashPassword(newPassword);
    adminUser.password = hashedPassword;
    await adminUser.save();

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (err: any) {
    console.error("Error en API change-password:", err);
    return NextResponse.json(
      { success: false, error: "Error en el servidor al cambiar la contraseña" },
      { status: 500 }
    );
  }
}
