import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { sendQrEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth");
  return verifySessionToken(authCookie?.value);
}

export async function POST(req: Request) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { registrationId } = body;

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: "Falta el dato obligatorio (registrationId)" },
        { status: 400 }
      );
    }

    const result = await sendQrEmail(registrationId);

    return NextResponse.json({
      success: true,
      method: result.method,
      mocked: !!result.mocked,
    });
  } catch (error: any) {
    console.error("Error en /api/admin/send-email:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error enviando correo electrónico: " + error.message,
      },
      { status: 500 }
    );
  }
}
