import crypto from "crypto";

// Clave secreta para firmar la cookie. En producción es OBLIGATORIO configurar SESSION_SECRET en el .env
const SECRET = process.env.SESSION_SECRET || "fallback_super_secret_session_key_987654321_qrflow";

/**
 * Genera un token de sesión firmado criptográficamente para el usuario administrador.
 */
export function createSessionToken(username: string): string {
  const payload = JSON.stringify({
    username,
    role: "admin",
    createdAt: Date.now(),
  });
  
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
    
  return `${Buffer.from(payload).toString("base64")}.${signature}`;
}

/**
 * Verifica si un token de sesión es válido, no ha sido alterado y no ha expirado.
 */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  
  const [payloadBase64, signature] = parts;
  
  try {
    const payload = Buffer.from(payloadBase64, "base64").toString("utf-8");
    
    // Validar integridad de la firma
    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex");
      
    if (signature !== expectedSignature) {
      console.warn("Intento de bypass de cookie detectado: Firma no coincide.");
      return false;
    }
    
    const data = JSON.parse(payload);
    
    // Validar que la sesión no tenga más de 7 días de antigüedad
    const age = Date.now() - data.createdAt;
    const maxAge = 1000 * 60 * 60 * 24 * 7; // 7 días en milisegundos
    if (age > maxAge) {
      console.log("Sesión de administrador expirada.");
      return false;
    }
    
    return data.role === "admin";
  } catch (error) {
    console.error("Error al decodificar o validar token de sesión:", error);
    return false;
  }
}
