import { MercadoPagoConfig, Preference } from "mercadopago";
import { dbConnect } from "@/lib/db";
import Registration from "@/models/Registration";
import EventConfig from "@/models/EventConfig";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.warn(
    "WARNING: MERCADOPAGO_ACCESS_TOKEN no está definido en las variables de entorno.",
  );
}

export const mercadopagoClient = new MercadoPagoConfig({
  accessToken: accessToken || "",
});

export interface PreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  unitPrice: number;
  title: string;
}

/**
 * Genera una preferencia de pago en Mercado Pago usando los precios seguros de la base de datos.
 */
export async function createPaymentPreference(
  registrationId: string,
  itemType: "ticket" | "card",
  origin: string,
): Promise<PreferenceResult> {
  // Asegurar conexión a base de datos
  await dbConnect();

  // Validar existencia de la inscripción
  const registration = await Registration.findById(registrationId);
  if (!registration) {
    throw new Error("No se encontró el registro especificado.");
  }

  // Obtener la configuración de precios
  const config = await EventConfig.findOne();
  if (!config) {
    throw new Error("No se ha configurado el evento en la base de datos.");
  }

  let unitPrice = 0;
  let title = "";

  if (itemType === "ticket") {
    unitPrice = config.ticketPrice || 0;
    title = "Friends Edition LSC";
  } else if (itemType === "card") {
    unitPrice = config.cardPrice || 0;
    title = "Friends Edition LSC";
  }

  if (unitPrice <= 0) {
    throw new Error(
      `El precio para '${itemType}' no está configurado o es inválido.`,
    );
  }

  const formattedItems = [
    {
      id: itemType,
      title: title,
      unit_price: unitPrice,
      quantity: 1,
      currency_id: "ARS",
    },
  ];

  const preference = new Preference(mercadopagoClient);

  const defaultBackUrls = {
    success: `${origin}/checkout/success`,
    failure: `${origin}/checkout/failure`,
    pending: `${origin}/checkout/pending`,
  };

  const isHttps = origin.startsWith("https://");

  const response = await preference.create({
    body: {
      items: formattedItems,
      back_urls: defaultBackUrls,
      ...(isHttps ? { auto_return: "approved" } : {}),
      external_reference: registrationId,
    },
  });

  if (!response.id || !response.init_point || !response.sandbox_init_point) {
    throw new Error("Error al obtener la respuesta del SDK de Mercado Pago.");
  }

  return {
    preferenceId: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point,
    unitPrice,
    title,
  };
}
