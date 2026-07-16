import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Registration from "@/models/Registration";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, registrationId } = body;

    if (!paymentId || !registrationId) {
      return NextResponse.json(
        { success: false, error: "El paymentId y el registrationId son obligatorios." },
        { status: 400 }
      );
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "El token de Mercado Pago no está configurado en el servidor." },
        { status: 500 }
      );
    }

    // 1. Conectar a base de datos y verificar que exista el registro
    await dbConnect();
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: "No se encontró el registro de inscripción." },
        { status: 404 }
      );
    }

    // Si ya figura como pagado en la base de datos, retornamos éxito inmediatamente
    if (registration.paid) {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    // 2. Consultar directamente a la API de Mercado Pago la veracidad de la transacción
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error al validar el pago en la API de Mercado Pago:", errorData);
      return NextResponse.json(
        { success: false, error: "No se pudo verificar el pago contra la API de Mercado Pago." },
        { status: 400 }
      );
    }

    const paymentData = await response.json();

    // 3. Validaciones críticas de seguridad
    // - El estado del pago en Mercado Pago debe ser 'approved'
    // - La external_reference cargada en el pago debe ser idéntica al ID del registro de inscripción
    const isApproved = paymentData.status === "approved";
    const isRefMatching = paymentData.external_reference === registrationId;

    if (!isApproved || !isRefMatching) {
      console.warn("Intento de validación fallido o sospechoso:", {
        isApproved,
        isRefMatching,
        status: paymentData.status,
        expectedRef: registrationId,
        receivedRef: paymentData.external_reference,
      });

      return NextResponse.json(
        { 
          success: false, 
          error: "La validación falló: el pago no figura aprobado o la referencia de registro no coincide." 
        },
        { status: 400 }
      );
    }

    // 4. Confirmar el pago en nuestra base de datos
    registration.paid = true;
    registration.paymentId = paymentId;
    await registration.save();

    console.log(`[PAGO APROBADO] Registro ${registrationId} marcado como pagado con éxito.`);

    return NextResponse.json({ success: true, paid: true });
  } catch (error: any) {
    console.error("Error en endpoint de feedback de Mercado Pago:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Ocurrió un error interno al validar el pago: " + (error.message || error) 
      },
      { status: 500 }
    );
  }
}
