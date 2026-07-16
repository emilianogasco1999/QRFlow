import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Registration from "@/models/Registration";
import EventConfig from "@/models/EventConfig";
import { createPaymentPreference } from "@/lib/mercadopago";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";

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
        { status: 401 },
      );
    }

    await dbConnect();
    const body = await req.json();
    const { registrationId, itemType } = body;

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: "Falta el dato obligatorio (registrationId)" },
        { status: 400 },
      );
    }

    if (itemType !== "ticket" && itemType !== "card") {
      return NextResponse.json(
        { success: false, error: "El itemType debe ser 'ticket' o 'card'" },
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

    const eventConfig = await EventConfig.findOne();
    let formattedDate = "-";
    if (eventConfig?.date) {
      const parts = eventConfig.date.split("-");
      if (parts.length === 3) {
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        formattedDate = eventConfig.date;
      }
    }

    // Obtener origen del request
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Generar la preferencia de Mercado Pago
    const result = await createPaymentPreference(
      registrationId,
      itemType,
      origin,
    );

    // Decidir dinámicamente si usar Sandbox o Producción basándonos en el tipo de Access Token
    const isProdToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith("APP_USR-");
    const paymentUrl = isProdToken ? result.initPoint : result.sandboxInitPoint;

    // Estilo HTML del Mail - Tema Spotify Oscuro Premium adaptado para pagos
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Completa tu pago - Local Social Club</title>
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
              text-transform: uppercase;
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
            .btn-pay-container {
              margin: 32px 0;
            }
            .btn-pay {
              background: linear-gradient(135deg, #009ee3 0%, #007eb5 100%);
              color: #ffffff !important;
              text-decoration: none;
              font-size: 15px;
              font-weight: 700;
              padding: 16px 36px;
              border-radius: 50px;
              display: inline-block;
              box-shadow: 0 10px 20px rgba(0, 158, 227, 0.3);
              letter-spacing: 0.5px;
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
              <h1>Completa tu Pago</h1>
              <p class="subtitle">LOCAL SOCIAL CLUB PAYMENT</p>
            </div>
            <div class="content">
              <p class="salutation">Hola ${user.fullName},</p>
              <p>Para confirmar tu acceso al evento de forma definitiva, por favor realizá el pago correspondiente utilizando el botón de abajo.</p>
              
              <div class="btn-pay-container">
                <a class="btn-pay" href="${paymentUrl}" target="_blank">PAGAR CON MERCADO PAGO</a>
              </div>

              <div class="details-box">
                <div class="detail-row">
                  <span class="detail-label">Concepto:</span>
                  <span class="detail-value">${result.title}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Monto:</span>
                  <span class="detail-value">$${result.unitPrice} ARS</span>
                </div>
              </div>
            </div>
            <div class="footer">
              <div class="footer-note">
                Este correo es automático. No responder este mail.
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
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // 1. Enviar por SMTP (Gmail) si está configurado
    if (smtpUser && smtpPass) {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Local Social Club" <${smtpUser}>`,
        to: user.email,
        subject: `Enlace de Pago - ${result.title}`,
        html: emailHtml,
      });

      return NextResponse.json({ success: true, method: "smtp" });
    }

    // 2. Enviar por Resend si está la API Key
    if (resendApiKey && resendApiKey !== "YOUR_RESEND_API_KEY") {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: "Local Social Club <onboarding@resend.dev>",
        to: [user.email],
        subject: `Enlace de Pago - ${result.title}`,
        html: emailHtml,
      });

      if (error) {
        console.error("Error de la API de Resend:", error);
        return NextResponse.json(
          { success: false, error: "Error de Resend: " + error.message },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true, method: "resend", data });
    }

    // 3. MOCK FALLBACK: Guardar el mail localmente
    const scratchDir = path.join(process.cwd(), "scratch");
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir);
    }
    fs.writeFileSync(
      path.join(scratchDir, "last-payment-email.html"),
      emailHtml,
    );

    console.log(
      "Simulador: Email de link de pago guardado en scratch/last-payment-email.html",
    );
    return NextResponse.json({
      success: true,
      mocked: true,
      message: "Email simulado guardado en scratch/last-payment-email.html",
      paymentUrl,
    });
  } catch (error: any) {
    console.error("Error en /api/admin/send-payment-link:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error enviando correo electrónico de pago: " + error.message,
      },
      { status: 500 },
    );
  }
}
