"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, ChevronDown } from "lucide-react";
import paises from "@/app/api/data/paises.json";

export default function UserForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [dialCode, setDialCode] = useState("+54"); // AR por defecto

  const [formData, setFormData] = useState({
    fullName: "",
    instagram: "",
    whatsapp: "",
    email: "",
    dob: "", // Fecha de nacimiento
    location: "",
    referral: "",
    dni: "",
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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Nombre y Apellido
    if (!formData.fullName.trim()) {
      errors.fullName = "revisá tu nombre y apellido";
    }

    // Fecha de Nacimiento (+25)
    if (!formData.dob) {
      errors.dob = "ingresá tu fecha de nacimiento";
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dobDate.getDate())
      ) {
        age--;
      }
      if (age < 25) {
        errors.dob = "Debés tener al menos 25 años para ingresar.";
      }
    }

    // DNI (Opcional, pero si se ingresa debe ser válido)
    if (formData.dni.trim()) {
      const dniDigits = formData.dni.replace(/\D/g, "");
      if (dniDigits.length < 7 || dniDigits.length > 9) {
        errors.dni = "el DNI debe tener entre 7 y 9 dígitos";
      }
    }

    // WhatsApp
    const whatsappDigits = formData.whatsapp.replace(/\D/g, "");
    if (!formData.whatsapp.trim() || whatsappDigits.length < 8) {
      errors.whatsapp = "revisá tu número de teléfono";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      errors.email = "revisá tu email";
    }

    // Instagram
    if (!formData.instagram.trim()) {
      errors.instagram = "revisá tu instagram";
    }

    // Ubicación
    if (!formData.location) {
      errors.location = "seleccioná tu ubicación";
    }

    // Referral
    if (!formData.referral) {
      errors.referral = "seleccioná cómo nos conociste";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setApiError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          instagram: formData.instagram.replace(/^@/, "").trim(),
          whatsapp: dialCode + formData.whatsapp.replace(/\D/g, ""), // Prefijo seleccionado + número limpio
          email: formData.email.trim(),
          dob: formData.dob,
          location: formData.location,
          referral: formData.referral,
          dni: formData.dni.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ocurrió un error en el envío.");
      }

      setQrToken(data.qrToken);
      setSubmitted(true);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#2d2c4a] flex flex-col items-center justify-center p-4 selection:bg-white selection:text-[#2d2c4a]">
      <div className="w-full max-w-md flex flex-col my-8">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form-container"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col space-y-6"
            >
              {/* Cabecera idéntica al diseño de la imagen */}
              <div className="text-center space-y-3">
                <h1 className="text-white text-2xl font-normal tracking-tight  ">
                  Te damos la bienvenida al club
                </h1>
                <p className="text-white/60 text-xs leading-relaxed max-w-xl mx-auto">
                  Un lugar para conocer personas que están en la misma que vos.
                  <br />
                  Nuevas conversaciones. Nuevos amigos. Nuevas historias.
                </p>
                <div className="pt-1.5">
                  <span className="inline-block bg-black/20 border border-[#f2e5d7]/15 text-[#f2e5d7] text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-widest">
                    +25 únicamente
                  </span>
                </div>
              </div>

              {/* Formulario vertical apilado */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Nombre y Apellido */}
                <div>
                  <label className="block text-white/80 text-xs font-semibold   mb-1.5 pl-0.5">
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="tu nombre completo"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    className="w-full bg-black/15 text-white placeholder-white/20 border border-[#f2e5d7]/10 focus:border-[#f2e5d7]/20 rounded-xl p-3.5 outline-none text-sm transition-colors"
                  />
                  {validationErrors.fullName && (
                    <p className="text-spotify-error text-xs mt-1.5 pl-1 font-medium">
                      {validationErrors.fullName}
                    </p>
                  )}
                </div>

                {/* 2. Fecha de Nacimiento */}
                <div>
                  <label className="block text-white/80 text-xs font-semibold   mb-1.5 pl-0.5">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => handleInputChange("dob", e.target.value)}
                    className="w-full bg-black/15 text-white border border-[#f2e5d7]/10 focus:border-[#f2e5d7]/20 rounded-xl p-3.5 outline-none text-sm cursor-pointer transition-colors"
                  />
                  {validationErrors.dob && (
                    <p className="text-spotify-error text-xs mt-1.5 pl-1 font-medium">
                      {validationErrors.dob}
                    </p>
                  )}
                </div>

                {/* 3. DNI */}
                <div>
                  <label className="block text-white/80 text-xs font-semibold   mb-1.5 pl-0.5">
                    DNI
                  </label>
                  <input
                    type="text"
                    placeholder="tu número de documento"
                    value={formData.dni}
                    onChange={(e) => handleInputChange("dni", e.target.value)}
                    className="w-full bg-black/15 text-white placeholder-white/20 border border-[#f2e5d7]/10 focus:border-[#f2e5d7]/20 rounded-xl p-3.5 outline-none text-sm transition-colors"
                  />
                  {validationErrors.dni && (
                    <p className="text-spotify-error text-xs mt-1.5 pl-1 font-medium">
                      {validationErrors.dni}
                    </p>
                  )}
                </div>

                {/* 4. WhatsApp */}
                <div>
                  <label className="block text-white/80 text-xs font-semibold   mb-1.5 pl-0.5">
                    Tu whatsapp — acá te enviamos la invitación
                  </label>
                  <div className="flex bg-black/15 rounded-xl border border-[#f2e5d7]/10 focus-within:border-[#f2e5d7]/20 overflow-hidden transition-colors">
                    {/* Selector de país */}
                    <div className="relative flex-shrink-0">
                      <select
                        value={dialCode}
                        onChange={(e) => setDialCode(e.target.value)}
                        className="h-full appearance-none text-white/90 text-xs font-bold pl-3 pr-7 py-3.5 border-r border-[#f2e5d7]/10 outline-none cursor-pointer hover:text-white transition-colors bg-transparent"
                      >
                        {paises.map((p) => (
                          <option
                            key={p.code}
                            value={p.dial_code}
                            style={{ background: "#1e1d38", color: "#fff" }}
                          >
                            {p.code} {p.dial_code} — {p.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/40"
                      />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="tu número"
                      value={formData.whatsapp}
                      onChange={(e) =>
                        handleInputChange("whatsapp", e.target.value)
                      }
                      className="flex-1 bg-transparent text-white placeholder-white/20 p-3.5 outline-none text-sm"
                    />
                  </div>
                  {validationErrors.whatsapp && (
                    <p className="text-spotify-error text-xs mt-1.5 pl-1 font-medium">
                      {validationErrors.whatsapp}
                    </p>
                  )}
                </div>

                {/* 5. Mail */}
                <div>
                  <label className="block text-white/80 text-xs font-semibold   mb-1.5 pl-0.5">
                    Mail
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tu@mail.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full bg-black/15 text-white placeholder-white/20 border border-[#f2e5d7]/10 focus:border-[#f2e5d7]/20 rounded-xl p-3.5 outline-none text-sm transition-colors"
                  />
                  {validationErrors.email && (
                    <p className="text-spotify-error text-xs mt-1.5 pl-1 font-medium">
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                {/* 6. Instagram */}
                <div>
                  <label className="block text-white/80 text-xs font-semibold   mb-1.5 pl-0.5">
                    @instagram
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@ tuinstagram"
                    value={formData.instagram}
                    onChange={(e) =>
                      handleInputChange("instagram", e.target.value)
                    }
                    className="w-full bg-black/15 text-white placeholder-white/20 border border-[#f2e5d7]/10 focus:border-[#f2e5d7]/20 rounded-xl p-3.5 outline-none text-sm transition-colors"
                  />
                  {validationErrors.instagram && (
                    <p className="text-spotify-error text-xs mt-1.5 pl-1 font-medium">
                      {validationErrors.instagram}
                    </p>
                  )}
                </div>

                {/* 7. Ubicación */}
                <div>
                  <label className="block text-white/80 text-xs font-semibold   mb-1.5 pl-0.5">
                    ¿De dónde sos?
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      className="w-full text-white border border-[#f2e5d7]/10 focus:border-[#f2e5d7]/20 rounded-xl p-3.5 outline-none text-sm appearance-none cursor-pointer transition-colors bg-transparent"
                      // style={{ background: "#1e1d38", color: "#fff" }}
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1e1d38" }}
                      >
                        seleccionar
                      </option>
                      <option
                        value="Ciudad Autónoma de Buenos Aires"
                        style={{ background: "#1e1d38" }}
                      >
                        Ciudad Autónoma de Buenos Aires
                      </option>
                      <option
                        value="Buenos Aires"
                        style={{ background: "#1e1d38" }}
                      >
                        Buenos Aires
                      </option>
                      <option
                        value="Catamarca"
                        style={{ background: "#1e1d38" }}
                      >
                        Catamarca
                      </option>
                      <option value="Chaco" style={{ background: "#1e1d38" }}>
                        Chaco
                      </option>
                      <option value="Chubut" style={{ background: "#1e1d38" }}>
                        Chubut
                      </option>
                      <option value="Córdoba" style={{ background: "#1e1d38" }}>
                        Córdoba
                      </option>
                      <option
                        value="Corrientes"
                        style={{ background: "#1e1d38" }}
                      >
                        Corrientes
                      </option>
                      <option
                        value="Entre Ríos"
                        style={{ background: "#1e1d38" }}
                      >
                        Entre Ríos
                      </option>
                      <option value="Formosa" style={{ background: "#1e1d38" }}>
                        Formosa
                      </option>
                      <option value="Jujuy" style={{ background: "#1e1d38" }}>
                        Jujuy
                      </option>
                      <option
                        value="La Pampa"
                        style={{ background: "#1e1d38" }}
                      >
                        La Pampa
                      </option>
                      <option
                        value="La Rioja"
                        style={{ background: "#1e1d38" }}
                      >
                        La Rioja
                      </option>
                      <option value="Mendoza" style={{ background: "#1e1d38" }}>
                        Mendoza
                      </option>
                      <option
                        value="Misiones"
                        style={{ background: "#1e1d38" }}
                      >
                        Misiones
                      </option>
                      <option value="Neuquén" style={{ background: "#1e1d38" }}>
                        Neuquén
                      </option>
                      <option
                        value="Río Negro"
                        style={{ background: "#1e1d38" }}
                      >
                        Río Negro
                      </option>
                      <option value="Salta" style={{ background: "#1e1d38" }}>
                        Salta
                      </option>
                      <option
                        value="San Juan"
                        style={{ background: "#1e1d38" }}
                      >
                        San Juan
                      </option>
                      <option
                        value="San Luis"
                        style={{ background: "#1e1d38" }}
                      >
                        San Luis
                      </option>
                      <option
                        value="Santa Cruz"
                        style={{ background: "#1e1d38" }}
                      >
                        Santa Cruz
                      </option>
                      <option
                        value="Santa Fe"
                        style={{ background: "#1e1d38" }}
                      >
                        Santa Fe
                      </option>
                      <option
                        value="Santiago del Estero"
                        style={{ background: "#1e1d38" }}
                      >
                        Santiago del Estero
                      </option>
                      <option
                        value="Tierra del Fuego, Antártida e Islas del Atlántico Sur"
                        style={{ background: "#1e1d38" }}
                      >
                        Tierra del Fuego, Antártida e Islas del Atlántico Sur
                      </option>
                      <option value="Tucumán" style={{ background: "#1e1d38" }}>
                        Tucumán
                      </option>
                      <option
                        value="Otro Pais"
                        style={{ background: "#1e1d38" }}
                      >
                        Otro País
                      </option>
                    </select>
                  </div>
                  {validationErrors.location && (
                    <p className="text-spotify-error text-xs mt-1.5 pl-1 font-medium">
                      {validationErrors.location}
                    </p>
                  )}
                </div>

                {/* 8. Cómo nos conociste */}
                <div>
                  <label className="block text-white/80 text-xs font-semibold   mb-1.5 pl-0.5">
                    ¿Cómo nos conociste?
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.referral}
                      onChange={(e) =>
                        handleInputChange("referral", e.target.value)
                      }
                      className="w-full text-white border border-[#f2e5d7]/10 focus:border-[#f2e5d7]/20 rounded-xl p-3.5 outline-none text-sm appearance-none cursor-pointer transition-colors bg-transparent"
                      // style={{ background: "#1e1d38", color: "#fff" }}
                    >
                      <option
                        value=""
                        disabled
                        style={{ background: "#1e1d38" }}
                      >
                        seleccionar opción
                      </option>
                      <option
                        value="Instagram"
                        style={{ background: "#1e1d38" }}
                      >
                        Instagram
                      </option>
                      <option
                        value="Un amigo"
                        style={{ background: "#1e1d38" }}
                      >
                        Un amigo
                      </option>
                      <option value="Tiktok" style={{ background: "#1e1d38" }}>
                        Tiktok
                      </option>
                      <option value="Otro" style={{ background: "#1e1d38" }}>
                        Otro
                      </option>
                    </select>
                  </div>
                  {validationErrors.referral && (
                    <p className="text-spotify-error text-xs mt-1.5 pl-1 font-medium">
                      {validationErrors.referral}
                    </p>
                  )}
                </div>

                {apiError && (
                  <div className="bg-spotify-error/10 p-3.5 rounded-xl border border-spotify-error/20 text-center">
                    <p className="text-spotify-error text-xs font-semibold">
                      {apiError}
                    </p>
                  </div>
                )}

                {/* Botón Enviar */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#f2e5d7] hover:opacity-90 active:scale-[0.98] text-[#2d2c4a] font-semibold   tracking-wider py-4 rounded-full text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      procesando
                    </>
                  ) : (
                    "Enviar Solicitud"
                  )}
                </button>
              </form>

              <p className="text-center text-white/40 text-xs mt-4">
                Revisaremos tu solicitud y te contactaremos pronto
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="success-container"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-black/10 border border-[#f2e5d7]/10 rounded-2xl p-6 sm:p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-[#f2e5d7]/10 border border-[#f2e5d7]/20 rounded-full flex items-center justify-center text-[#f2e5d7] mx-auto">
                <Check size={28} />
              </div>

              <div className="space-y-2">
                <h1 className="text-white text-2xl font-bold tracking-tight  ">
                  ¡solicitud enviada!
                </h1>
                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                  Revisaremos tu solicitud y, una vez aprobada, te enviaremos tu
                  código QR de acceso por mail.
                </p>
              </div>

              <div className="bg-black/20 rounded-xl p-4 text-left max-w-sm mx-auto border border-[#f2e5d7]/5 space-y-2.5">
                <p className="text-[10px] text-[#f2e5d7]/40 uppercase tracking-widest mb-1 pl-0.5">
                  datos registrados
                </p>
                <div className="flex justify-between text-xs text-white/80 border-b border-white/5 pb-2">
                  <span className="font-semibold">Nombre:</span>
                  <span>{formData.fullName}</span>
                </div>
                <div className="flex justify-between text-xs text-white/80 border-b border-white/5 pb-2">
                  <span className="font-semibold">Instagram:</span>
                  <span>@{formData.instagram.replace(/^@/, "")}</span>
                </div>
                <div className="flex justify-between text-xs text-white/80 border-b border-white/5 pb-2">
                  <span className="font-semibold">WhatsApp:</span>
                  <span>+54 {formData.whatsapp}</span>
                </div>
                <div className="flex justify-between text-xs text-white/80">
                  <span className="font-semibold">Email:</span>
                  <span className="truncate max-w-[180px]">
                    {formData.email}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setFormData({
                    fullName: "",
                    instagram: "",
                    whatsapp: "",
                    email: "",
                    dob: "",
                    location: "",
                    referral: "",
                    dni: "",
                  });
                  setSubmitted(false);
                }}
                className="w-full max-w-xs bg-white text-[#5c192d] hover:bg-white/90 font-bold uppercase tracking-wider py-3.5 rounded-full text-xs transition-transform active:scale-95 mx-auto block"
              >
                Registrar otra solicitud
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
