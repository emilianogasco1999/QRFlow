import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Registration from "@/models/Registration";
import { cookies } from "next/headers";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth");
  return !!(authCookie && authCookie.value === "true");
}

export async function GET() {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    await dbConnect();
    const list = await Registration.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, list });
  } catch (error: any) {
    console.error("Error en /api/admin/registrations:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los registros" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    await dbConnect();
    const result = await Registration.deleteMany({});
    return NextResponse.json({
      success: true,
      message: "Base de datos de registros limpiada correctamente",
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Error en DELETE /api/admin/registrations:", error);
    return NextResponse.json(
      { success: false, error: "Error al borrar los registros" },
      { status: 500 }
    );
  }
}

