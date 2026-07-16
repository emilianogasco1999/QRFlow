"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Ticket, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const registrationId = searchParams.get("external_reference");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentId || !registrationId) {
        setError("Faltan parámetros de verificación en la URL.");
        setLoading(false);
        return;
      }

      if (status !== "approved") {
        setError("El pago no ha sido aprobado por Mercado Pago (Estado: " + status + ").");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/mercadopago/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId,
            registrationId,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setSuccess(true);
        } else {
          setError(data.error || "No se pudo validar el pago en nuestro servidor.");
        }
      } catch (err: any) {
        console.error("Error validando pago:", err);
        setError("Error de conexión al verificar el pago.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [paymentId, status, registrationId]);

  return (
    <div className="w-full max-w-md bg-[#121212] border border-white/5 rounded-3xl p-8 spotify-shadow-heavy text-center space-y-6">
      {loading ? (
        <div className="py-12 space-y-4">
          <Loader2 className="animate-spin text-spotify-accent mx-auto" size={48} />
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">
            Verificando tu Pago
          </h1>
          <p className="text-spotify-text-secondary text-xs px-6 leading-relaxed">
            Estamos comprobando el estado de tu transacción con Mercado Pago de forma segura. No cierres esta ventana.
          </p>
        </div>
      ) : success ? (
        <div className="space-y-6 py-6">
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto animate-bounce-short">
            <CheckCircle2 size={44} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-wide">
              ¡Pago Confirmado!
            </h1>
            <p className="text-spotify-text-secondary text-xs px-4">
              Tu entrada ha sido activada en el sistema de forma definitiva.
            </p>
          </div>

          <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-spotify-text-secondary font-medium">Nro. de Operación:</span>
              <span className="text-white font-bold font-mono">{paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-spotify-text-secondary font-medium font-mono">Estado:</span>
              <span className="text-green-400 font-bold uppercase tracking-wider text-[10px] bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                Aprobado
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-spotify-accent/10 border border-spotify-accent/20 p-4 rounded-2xl text-left text-xs">
            <div className="text-spotify-accent flex-shrink-0">
              <Mail size={20} />
            </div>
            <p className="text-spotify-text-near leading-relaxed">
              <strong>¡Revisá tu correo!</strong> En los próximos minutos te llegará tu invitación oficial con el código QR de acceso.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-spotify-accent hover:opacity-90 active:scale-95 text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all w-full"
            >
              <Ticket size={14} />
              Volver al inicio
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6 py-6">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400 mx-auto">
            <XCircle size={44} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white uppercase tracking-wide">
              No pudimos verificar tu pago
            </h1>
            <p className="text-spotify-text-secondary text-xs leading-relaxed px-4">
              {error}
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all w-full"
            >
              <ArrowLeft size={14} />
              Volver al inicio
            </Link>
            <p className="text-[10px] text-spotify-text-secondary">
              Si realizaste el pago y creés que es un error, por favor contactate con soporte.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-[#121212] border border-white/5 rounded-3xl p-8 spotify-shadow-heavy text-center py-20 space-y-4">
            <Loader2 className="animate-spin text-spotify-accent mx-auto" size={48} />
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">Cargando...</h1>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  );
}
