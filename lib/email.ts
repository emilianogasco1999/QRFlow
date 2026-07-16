import { dbConnect } from "@/lib/db";
import Registration from "@/models/Registration";
import EventConfig from "@/models/EventConfig";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

export async function sendQrEmail(registrationId: string): Promise<{
  success: boolean;
  method: string;
  mocked?: boolean;
  error?: string;
}> {
  await dbConnect();

  const user = await Registration.findById(registrationId);
  if (!user) {
    throw new Error("Registro de inscripción no encontrado");
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
            letter-spacing: 2px;
            font-weight: 700;
          }
          .content {
            padding: 32px;
          }
          .salutation {
            color: #ffffff;
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 12px 0;
            text-align: left;
          }
          p {
            color: #a4a3b6;
            font-size: 13px;
            line-height: 1.6;
            margin: 0 0 24px 0;
            text-align: left;
          }
          .qr-container {
            margin: 32px 0;
            text-align: center;
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
          .info-box {
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 16px;
            padding: 16px;
            text-align: left;
            margin-top: 16px;
          }
          .info-item {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
            align-items: flex-start;
          }
          .info-item:last-child {
            margin-bottom: 0;
          }
          .info-icon {
            font-size: 16px;
            line-height: 1.4;
            flex-shrink: 0;
          }
          .info-content {
            color: #a4a3b6;
            font-size: 12px;
            line-height: 1.5;
          }
          .info-content strong {
            color: #ffffff;
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
            <p class="salutation">Hola ${user.fullName}</p>
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
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Hora:</span>
                <span class="detail-value">${eventConfig?.time || "-"}</span>
              </div>
              ${eventConfig?.location ? `
              <div class="detail-row">
                <span class="detail-label">Lugar:</span>
                <span class="detail-value">${eventConfig.location}</span>
              </div>
              ` : ""}
              ${eventConfig?.entryLimit ? `
              <div class="detail-row">
                <span class="detail-label">Ingreso hasta:</span>
                <span class="detail-value">${eventConfig.entryLimit}</span>
              </div>
              ` : ""}
            </div>

            <div class="info-box">
              <div class="info-item">
                <span class="info-icon">🎁</span>
                <div class="info-content">
                  <strong>Tu entrada incluye:</strong> vaso, hielo y sorpresas toda la noche.
                </div>
              </div>
              <div class="info-item">
                <span class="info-icon">⚠️</span>
                <div class="info-content">
                  <strong>Importante:</strong> No vendemos alcohol. ¡Traé lo que vayas a consumir!
                </div>
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
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // 1. Si está configurado SMTP (Gmail), usamos Nodemailer para enviar a cualquier persona sin dominio
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
      subject: "Tu invitación con código QR - Bienvenido al Club",
      html: emailHtml,
      attachments: [
        {
          filename: "qr.png",
          path: qrUrl,
          cid: "qr-code", // coincide con src="cid:qr-code" en el HTML
        },
      ],
    });

    user.emailSent = true;
    await user.save();
    return { success: true, method: "smtp" };
  }

  // 2. Si no hay SMTP pero sí Resend API Key, usamos Resend
  if (resendApiKey && resendApiKey !== "YOUR_RESEND_API_KEY") {
    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
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

    if (error) {
      console.error("Error de la API de Resend:", error);
      throw new Error(error.message);
    }

    user.emailSent = true;
    await user.save();
    return { success: true, method: "resend" };
  }

  // 3. MOCK FALLBACK: Guardar el mail en un archivo local para testing sin requerir credenciales
  const scratchDir = path.join(process.cwd(), "scratch");
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir);
  }
  const previewHtml = emailHtml.replace("cid:qr-code", qrUrl);
  fs.writeFileSync(path.join(scratchDir, "last-email.html"), previewHtml);

  user.emailSent = true;
  await user.save();

  console.log(
    "Ni SMTP ni RESEND_API_KEY configuradas. Email simulado guardado en scratch/last-email.html"
  );
  return {
    success: true,
    method: "mock",
    mocked: true,
  };
}
