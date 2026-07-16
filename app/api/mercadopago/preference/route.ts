import { NextResponse } from "next/server";
import { createPaymentPreference } from "@/lib/mercadopago";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { registrationId, itemType } = body;

    // Validación básica de parámetros
    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: "El registrationId es requerido." },
        { status: 400 }
      );
    }

    if (itemType !== "ticket" && itemType !== "card") {
      return NextResponse.json(
        { success: false, error: "El itemType debe ser 'ticket' o 'card'." },
        { status: 400 }
      );
    }

    // Obtener el origen de la petición para las URLs de retorno
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Crear la preferencia delegando en la función reutilizable
    const result = await createPaymentPreference(registrationId, itemType, origin);

    return NextResponse.json({
      success: true,
      preferenceId: result.preferenceId,
      initPoint: result.initPoint,
      sandboxInitPoint: result.sandboxInitPoint,
    });
  } catch (error: any) {
    console.error("Error al crear preferencia de Mercado Pago:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Ocurrió un error al procesar la preferencia de pago: " + (error.message || error) 
      },
      { status: 500 }
    );
  }
}
