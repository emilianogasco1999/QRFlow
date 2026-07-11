import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Registration from "@/models/Registration";
import { cookies } from "next/headers";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth");
  return !!(authCookie && authCookie.value === "true");
}

export async function GET(req: Request) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const qrToken = searchParams.get("qrToken");

    if (!qrToken) {
      return NextResponse.json(
        { success: false, error: "Token faltante en los parámetros" },
        { status: 400 }
      );
    }

    const user = await Registration.findOne({ qrToken });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invitado no encontrado en la base de datos" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Error en GET /api/admin/scan:", error);
    return NextResponse.json(
      { success: false, error: "Error al buscar el token: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { registrationId, attended } = await req.json();

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: "Falta el ID del registro" },
        { status: 400 }
      );
    }

    const user = await Registration.findByIdAndUpdate(
      registrationId,
      { attended },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Registro no encontrado para actualizar" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Error en POST /api/admin/scan:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la asistencia: " + error.message },
      { status: 500 }
    );
  }
}
