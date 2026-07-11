import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Registration from "@/models/Registration";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { instagram, whatsapp, email, dob, location, referral } = body;

    if (!instagram || !whatsapp || !email || !dob || !location || !referral) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Limpieza básica del username de Instagram (remueve @ y fuerza minúsculas)
    let sanitizedInstagram = instagram.trim().toLowerCase();
    if (sanitizedInstagram.startsWith("@")) {
      sanitizedInstagram = sanitizedInstagram.substring(1);
    }

    // Generar token QR seguro en el backend
    const qrToken = crypto.randomUUID();

    const newRegistration = new Registration({
      instagram: sanitizedInstagram,
      whatsapp: whatsapp.trim(),
      email: email.trim().toLowerCase(),
      dob,
      location,
      referral,
      qrToken,
    });

    await newRegistration.save();

    return NextResponse.json({ success: true, qrToken });
  } catch (error: any) {
    console.error("Error en /api/register:", error);

    // Capturar error de duplicidad de Mongoose/MongoDB (código 11000)
    if (error.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0];
      let errorMsg = "Los datos ingresados ya se encuentran registrados.";
      
      if (key === "email") {
        errorMsg = "El email ingresado ya está registrado.";
      } else if (key === "instagram") {
        errorMsg = "El usuario de Instagram ya está registrado.";
      } else if (key === "qrToken") {
        errorMsg = "Error de colisión de token. Por favor, reintenta enviar el formulario.";
      }

      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: "Ocurrió un error al procesar el registro: " + error.message },
      { status: 500 }
    );
  }
}
