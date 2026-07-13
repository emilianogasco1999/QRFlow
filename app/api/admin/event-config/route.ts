import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import EventConfig from "@/models/EventConfig";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

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
    let config = await EventConfig.findOne();
    if (!config) {
      // Retorna valores vacíos por defecto si no existe
      config = new EventConfig({ date: "", time: "" });
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error("Error en GET /api/admin/event-config:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener la configuración del evento" },
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
    const body = await req.json();
    const { date, time } = body;

    const config = await EventConfig.findOneAndUpdate(
      {},
      { date: date || "", time: time || "" },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error("Error en POST /api/admin/event-config:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar la configuración del evento" },
      { status: 500 }
    );
  }
}
