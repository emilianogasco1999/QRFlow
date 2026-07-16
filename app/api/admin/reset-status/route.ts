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

export async function POST() {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Resetear masivamente:
    // - Setea paid, emailSent y attended en false.
    // - Remueve el campo paymentId de los documentos.
    const result = await Registration.updateMany(
      {},
      {
        $set: {
          paid: false,
          emailSent: false,
          attended: false,
        },
        $unset: {
          paymentId: "",
        },
      }
    );

    console.log(
      `[RESETEO MASIVO] Estados reiniciados. Registros modificados: ${result.modifiedCount}`
    );

    return NextResponse.json({
      success: true,
      message: "Estados reiniciados con éxito para todos los registros.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("Error al resetear estados de registros:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Error interno al resetear los estados: " + (error.message || error) 
      },
      { status: 500 }
    );
  }
}
