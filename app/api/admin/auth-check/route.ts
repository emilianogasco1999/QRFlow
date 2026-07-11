import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("admin_auth");

    if (authCookie && authCookie.value === "true") {
      await dbConnect();
      
      // Buscar al usuario administrador para verificar su contraseña
      const user = await User.findOne({ username: "admin" });
      const defaultHash = hashPassword("admin");
      
      const isDefaultPassword = user ? user.password === defaultHash : true;

      return NextResponse.json({ 
        authenticated: true,
        isDefaultPassword 
      });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (err: any) {
    console.error("Error en API auth-check GET:", err);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Eliminar la cookie de sesión seteando maxAge a 0
    cookieStore.set("admin_auth", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Sesión cerrada correctamente" });
  } catch (err: any) {
    console.error("Error en API auth-check POST (logout):", err);
    return NextResponse.json(
      { success: false, error: "Error en el servidor al cerrar sesión" },
      { status: 500 }
    );
  }
}
