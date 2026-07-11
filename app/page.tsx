"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";

const stepsContent = [
  {
    id: 1,
    title: "bienvenido al club",
    subtitle: "eterna es esa previa que no querés que termine",
  },
  {
    id: 2,
    title: "tu correo de contacto",
    subtitle: "acá te enviaremos actualizaciones de tus accesos",
  },
  {
    id: 3,
    title: "contanos más",
    subtitle: "fecha de nacimiento y desde dónde sos",
  },
  {
    id: 4,
    title: "¿cómo nos conociste?",
    subtitle: "nos ayuda a saber dónde están los del club",
  },
];

export default function UserForm() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = adelante, -1 = atrás
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [qrToken, setQrToken] = useState("");

  const [formData, setFormData] = useState({
    instagram: "",
    whatsapp: "",
    email: "",
    dob: "", // Lo usamos para la fecha de nacimiento
    location: "",
    referral: "",
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateStep = (currentStep: number) => {
    const errors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.instagram.trim()) {
        errors.instagram = "revisá tu instagram";
      }
      if (!formData.whatsapp.trim() || formData.whatsapp.length < 8) {
        errors.whatsapp = "revisá tu número";
      }
    } else if (currentStep === 2) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim() || !emailRegex.test(formData.email)) {
        errors.email = "revisá tu email";
      }
    } else if (currentStep === 3) {
      if (!formData.dob) {
        errors.dob = "ingresá tu fecha de nacimiento";
      }
      if (!formData.location) {
        errors.location = "seleccioná tu ubicación";
      }
    } else if (currentStep === 4) {
      if (!formData.referral) {
        errors.referral = "seleccioná una opción";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setDirection(1);
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    setApiError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagram: formData.instagram,
          whatsapp: "+54" + formData.whatsapp.replace(/\D/g, ""), // Prefijo AR y número limpio
          email: formData.email,
          dob: formData.dob,
          location: formData.location,
          referral: formData.referral,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ocurrió un error en el envío.");
      }

      setQrToken(data.qrToken);
      setDirection(1);
      setStep(5); // Paso de Éxito
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Variantes de animación para el efecto Swipe fluido
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <main className="min-h-screen bg-spotify-accent flex flex-col items-center justify-center p-4 selection:bg-white selection:text-spotify-accent">
      <div className="w-full max-w-md flex flex-col min-h-[500px]">
        {/* Cabecera del Formulario */}
        {step < 5 && (
          <div className="flex justify-between items-center mb-12 px-2">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className="w-10 h-10" />
            )}

            {/* Barra de Progreso */}
            <div className="flex-1 max-w-[200px] mx-4">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
              <div className="text-center text-white/50 text-[10px] uppercase tracking-wider mt-2">
                Paso {step} de 4
              </div>
            </div>

            {/* Logotipo de Reloj de Arena */}
            <div className="text-3xl text-white/40 select-none">⌛</div>
          </div>
        )}

        {/* Contenedor de Animación */}
        <div className="flex-1 flex flex-col justify-center relative overflow-hidden px-2">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex flex-col"
            >
              {step <= 4 && (
                <div className="mb-8">
                  <h1 className="text-white text-3xl font-bold mb-2 tracking-tight">
                    {stepsContent[step - 1].title}
                  </h1>
                  <p className="text-white/60 text-sm">
                    {stepsContent[step - 1].subtitle}
                  </p>
                </div>
              )}

              {/* Paso 1: Instagram + WhatsApp */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">
                      instagram
                    </label>
                    <input
                      type="text"
                      placeholder="@ tuinstagram"
                      value={formData.instagram}
                      onChange={(e) =>
                        handleInputChange("instagram", e.target.value)
                      }
                      className="w-full bg-black/25 text-white placeholder-white/30 rounded-lg p-4 outline-none spotify-input-inset text-base"
                    />
                    {validationErrors.instagram && (
                      <p className="text-spotify-error text-xs mt-2 font-medium">
                        {validationErrors.instagram}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">
                      tu whatsapp
                    </label>
                    <div className="flex bg-black/25 rounded-lg overflow-hidden spotify-input-inset">
                      <div className="flex items-center justify-center px-4 border-r border-white/10 text-white/60 text-sm font-semibold select-none">
                        🇦🇷 +54
                      </div>
                      <input
                        type="tel"
                        placeholder="tu número"
                        value={formData.whatsapp}
                        onChange={(e) =>
                          handleInputChange("whatsapp", e.target.value)
                        }
                        className="flex-1 bg-transparent text-white placeholder-white/30 p-4 outline-none text-base"
                      />
                    </div>
                    {validationErrors.whatsapp && (
                      <p className="text-spotify-error text-xs mt-2 font-medium">
                        {validationErrors.whatsapp}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 2: Email */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">
                      mail
                    </label>
                    <input
                      type="email"
                      placeholder="tu@mail.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full bg-black/25 text-white placeholder-white/30 rounded-lg p-4 outline-none spotify-input-inset text-base"
                    />
                    {validationErrors.email && (
                      <p className="text-spotify-error text-xs mt-2 font-medium">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 3: Edad + Ubicación */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">
                      fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className="w-full bg-black/25 text-white rounded-lg p-4 outline-none spotify-input-inset text-base cursor-pointer"
                    />
                    {validationErrors.dob && (
                      <p className="text-spotify-error text-xs mt-2 font-medium">
                        {validationErrors.dob}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">
                      ¿de dónde sos?
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      className="w-full bg-black/25 text-white rounded-lg p-4 outline-none spotify-input-inset text-base appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        seleccionar
                      </option>
                      <option value="Buenos Aires">Buenos Aires</option>
                      <option value="Córdoba">Córdoba</option>
                      <option value="Santa Fe">Santa Fe</option>
                      <option value="Mendoza">Mendoza</option>
                      <option value="Otra provincia">Otra provincia</option>
                    </select>
                    {validationErrors.location && (
                      <p className="text-spotify-error text-xs mt-2 font-medium">
                        {validationErrors.location}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 4: Cómo nos conociste */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">
                      ¿cómo nos conociste?
                    </label>
                    <select
                      value={formData.referral}
                      onChange={(e) =>
                        handleInputChange("referral", e.target.value)
                      }
                      className="w-full bg-black/25 text-white rounded-lg p-4 outline-none spotify-input-inset text-base appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        seleccionar opción
                      </option>
                      <option value="Instagram">Instagram</option>
                      <option value="Un amigo">Un amigo</option>
                      <option value="Tiktok">Tiktok</option>
                      <option value="Otro">Otro</option>
                    </select>
                    {validationErrors.referral && (
                      <p className="text-spotify-error text-xs mt-2 font-medium">
                        {validationErrors.referral}
                      </p>
                    )}
                  </div>

                  {apiError && (
                    <div className="bg-black/20 p-4 rounded-lg border border-spotify-error/30">
                      <p className="text-spotify-error text-sm font-medium">
                        {apiError}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 5: Éxito */}
              {step === 5 && (
                <div className="text-center space-y-6">
                  <div className="text-4xl">🎉</div>
                  <div>
                    <h1 className="text-white text-3xl font-bold tracking-tight mb-2">
                      ¡solicitud enviada!
                    </h1>
                    <p className="text-white/60 text-sm">
                      Revisaremos tu solicitud y, una vez aprobada, te
                      enviaremos tu código QR de acceso por mail.
                    </p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4 text-left max-w-xs mx-auto">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                      datos registrados
                    </p>
                    <p className="text-sm text-white/90">
                      <strong>Instagram:</strong> @{formData.instagram}
                    </p>
                    <p className="text-sm text-white/90">
                      <strong>WhatsApp:</strong> +54 {formData.whatsapp}
                    </p>
                    <p className="text-sm text-white/90">
                      <strong>Email:</strong> {formData.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setFormData({
                        instagram: "",
                        whatsapp: "",
                        email: "",
                        dob: "",
                        location: "",
                        referral: "",
                      });
                      setStep(1);
                    }}
                    className="w-full max-w-xs bg-white text-spotify-accent hover:bg-white/90 font-bold uppercase tracking-wider py-4 rounded-full text-sm transition-transform active:scale-95"
                  >
                    Volver al Inicio
                  </button>
                </div>
              )}

              {/* Botón de Progreso Principal */}
              {step < 5 && (
                <div className="mt-8">
                  {step < 4 ? (
                    <button
                      onClick={handleNext}
                      className="w-full bg-[#f6ebdd] text-spotify-accent hover:bg-[#eae0d2] font-bold uppercase tracking-wider py-4 rounded-full text-sm transition-transform active:scale-95"
                    >
                      continuar
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full bg-[#f6ebdd] text-spotify-accent hover:bg-[#eae0d2] font-bold uppercase tracking-wider py-4 rounded-full text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          procesando
                        </>
                      ) : (
                        "enviar solicitud"
                      )}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step < 5 && (
          <p className="text-center text-white/40 text-xs mt-8">
            revisaremos tu solicitud y te contactaremos pronto
          </p>
        )}
      </div>
    </main>
  );
}
