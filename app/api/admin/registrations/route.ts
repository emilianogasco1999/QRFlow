import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Registration from "@/models/Registration";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth");
  return verifySessionToken(authCookie?.value);
}

export async function GET(req: Request) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    const query: any = {};

    if (status === "sent") {
      query.emailSent = true;
    } else if (status === "pending") {
      query.emailSent = false;
    } else if (status === "attended") {
      query.attended = true;
    } else if (status === "not-attended") {
      query.emailSent = true;
      query.attended = { $ne: true };
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { instagram: searchRegex },
        { whatsapp: searchRegex },
        { email: searchRegex },
        { dni: searchRegex }
      ];
    }

    const [list, total] = await Promise.all([
      Registration.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Registration.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      list,
      total,
      page,
      limit,
      totalPages
    });
  } catch (error: any) {
    console.error("Error en /api/admin/registrations:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los registros" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const result = await Registration.findByIdAndDelete(id);
      if (!result) {
        return NextResponse.json(
          { success: false, error: "Registro no encontrado" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        message: "Registro eliminado correctamente",
      });
    }

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
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    await dbConnect();
    const { id, dni, paid } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Falta el ID del registro" },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (dni !== undefined) updateData.dni = dni ? dni.trim() : "";
    if (paid !== undefined) updateData.paid = paid;

    const user = await Registration.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Registro no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Error en PUT /api/admin/registrations:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar el registro: " + error.message },
      { status: 500 },
    );
  }
}
