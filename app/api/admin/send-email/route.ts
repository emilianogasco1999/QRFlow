import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Registration from "@/models/Registration";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth");
  return !!(authCookie && authCookie.value === "true");
}

export async function POST(req: Request) {
  try {
    if (!(await isAuthorized())) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    await dbConnect();
    const body = await req.json();
    const { registrationId } = body;

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: "Falta el dato obligatorio (registrationId)" },
        { status: 400 },
      );
    }

    const user = await Registration.findById(registrationId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Registro no encontrado" },
        { status: 404 },
      );
    }

    // Usar API de QRServer para renderizar el QR en tiempo real desde el mail
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${user.qrToken}`;

    // Estilo HTML del Mail - Tema Spotify Oscuro Premium
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Tu Invitación al Club</title>
          <style>
            body {
              background-color: #0b0b0b;
              color: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 40px 20px;
              text-align: center;
            }
            .email-container {
              max-width: 480px;
              margin: 0 auto;
              background-color: #121212;
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 80px rgba(45, 44, 74, 0.15);
            }
            .header {
              background: linear-gradient(135deg, #1e1b2f 0%, #0d0c18 100%);
              padding: 40px 32px 32px 32px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            }
            h1 {
              color: #ffffff;
              font-size: 22px;
              font-weight: 800;
              margin: 0 0 8px 0;
              letter-spacing: -0.5px;
              text-transform: uppercase;
            }
            .subtitle {
              color: #8e8d9f;
              font-size: 13px;
              margin: 0;
              font-weight: 500;
              letter-spacing: 0.5px;
            }
            .content {
              padding: 32px;
            }
            .salutation {
              color: #ffffff;
              font-size: 15px;
              font-weight: 600;
              margin-top: 0;
              margin-bottom: 12px;
            }
            p {
              color: #a5a4b6;
              font-size: 14px;
              line-height: 1.6;
              margin-top: 0;
              margin-bottom: 28px;
            }
            .qr-container {
              background: rgba(255, 255, 255, 0.02);
              border: 1px solid rgba(255, 255, 255, 0.06);
              border-radius: 20px;
              padding: 24px;
              display: inline-block;
              margin-bottom: 28px;
              box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
            }
            .qr-wrapper {
              background-color: #ffffff;
              padding: 16px;
              border-radius: 12px;
              display: inline-block;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            }
            .qr-image {
              display: block;
              width: 180px;
              height: 180px;
            }
            .details-box {
              background-color: rgba(255, 255, 255, 0.02);
              border: 1px solid rgba(255, 255, 255, 0.04);
              border-radius: 16px;
              padding: 16px;
              text-align: left;
              margin-bottom: 12px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 13px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            }
            .detail-row:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
            .detail-row:first-child {
              padding-top: 0;
            }
            .detail-label {
              color: #8e8d9f;
              font-weight: 500;
            }
            .detail-value {
              color: #ffffff;
              font-weight: 600;
            }
            .footer {
              padding: 32px;
              background-color: rgba(0, 0, 0, 0.2);
              border-top: 1px solid rgba(255, 255, 255, 0.03);
            }
            .footer-note {
              color: #6c6a7e;
              font-size: 11px;
              line-height: 1.5;
              margin-bottom: 16px;
            }
            .brand {
              color: #2d2c4a;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>Te damos la bienvenida al club</h1>
              <p class="subtitle">LOCAL SOCIAL CLUB ACCESS CONTROL</p>
            </div>
            <div class="content">
              <p class="salutation">Hola @${user.fullName}</p>
              <p>Tu solicitud de acceso ha sido aprobada. Presentá este código QR único al ingresar al evento. Recordá que tu entrada es personal e intransferible.</p>
              <div class="qr-container">
                <div class="qr-wrapper">
                  <img class="qr-image" src="cid:qr-code" alt="Código QR de Invitación" />
                </div>
              </div>
              <div class="details-box">
                <div class="detail-row">
                  <span class="detail-label">Nombre:</span>
                  <span class="detail-value">${user.fullName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">DNI:</span>
                  <span class="detail-value">${user.dni}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">WhatsApp:</span>
                  <span class="detail-value">${user.whatsapp}</span>
                </div>
              </div>
            </div>
            <div class="footer">
              <div class="footer-note">
                Este correo es automático. No responder este mail
              </div>
              <div class="brand">
                Local Social Club &copy; 2026
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey || resendApiKey === "YOUR_RESEND_API_KEY") {
      // MOCK FALLBACK: Guardar el mail en un archivo local para testing sin requerir API key
      const scratchDir = path.join(process.cwd(), "scratch");
      if (!fs.existsSync(scratchDir)) {
        fs.mkdirSync(scratchDir);
      }
      // Reemplazar cid por url real para que se previsualice en el navegador local
      const previewHtml = emailHtml.replace("cid:qr-code", qrUrl);
      fs.writeFileSync(path.join(scratchDir, "last-email.html"), previewHtml);

      // Actualizar estado en base de datos
      user.emailSent = true;
      await user.save();

      console.log(
        "RESEND_API_KEY no configurada. Email simulado guardado en scratch/last-email.html",
      );
      return NextResponse.json({
        success: true,
        mocked: true,
        message:
          "Email simulado guardado localmente en scratch/last-email.html",
      });
    }

    // Enviar usando Resend (onboarding@resend.dev por defecto de test en Resend)
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: "Local Social Club <onboarding@resend.dev>",
      to: [user.email],
      subject: "Tu invitación con código QR - Bienvenido al Club",
      html: emailHtml,
      attachments: [
        {
          path: qrUrl,
          filename: "qr.png",
          inlineContentId: "qr-code",
        },
      ],
    });

    // Actualizar estado en base de datos
    user.emailSent = true;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error en /api/admin/send-email:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error enviando correo electrónico: " + error.message,
      },
      { status: 500 },
    );
  }
}
