"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  Mail,
  ExternalLink,
  RefreshCw,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Camera,
  Check,
  X,
  Lock,
  User,
  LogOut,
  Calendar,
} from "lucide-react";

interface RegistrationItem {
  _id: string;
  fullName: string;
  instagram: string;
  whatsapp: string;
  email: string;
  dob: string;
  location: string;
  referral: string;
  qrToken: string;
  createdAt: string;
  emailSent: boolean;
  attended?: boolean;
  dni?: string;
  paid: boolean;
  paymentId: string;
}

export default function AdminDashboard() {
  const [list, setList] = useState<RegistrationItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "sent" | "pending" | "attended" | "not-attended"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSingleDeleteOpen, setIsSingleDeleteOpen] = useState(false);
  const [singleDeleteTargetUser, setSingleDeleteTargetUser] =
    useState<RegistrationItem | null>(null);
  const [isSingleDeleting, setIsSingleDeleting] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados del Escáner y Asistencia
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState<any>(null);
  const [scannedUser, setScannedUser] = useState<RegistrationItem | null>(null);
  const [isFetchScannedLoading, setIsFetchScannedLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

  // Trackea los estados de envío de mail por usuario (e.g., { [id]: 'idle' | 'sending' | 'success' | 'error' })
  const [emailStatus, setEmailStatus] = useState<
    Record<string, "idle" | "sending" | "success" | "error">
  >({});
  const [statusMessage, setStatusMessage] = useState<Record<string, string>>(
    {},
  );

  // Estados de Autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Estados de Cambio de Contraseña Obligatorio
  const [isDefaultPassword, setIsDefaultPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Estados para Carga de DNI
  const [isDniModalOpen, setIsDniModalOpen] = useState(false);
  const [dniTargetUser, setDniTargetUser] = useState<RegistrationItem | null>(
    null,
  );
  const [dniInput, setDniInput] = useState("");
  const [isDniSaving, setIsDniSaving] = useState(false);
  const [dniError, setDniError] = useState("");

  // Estados para Configuración de Fecha, Hora y Precios del Evento
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [configError, setConfigError] = useState("");

  // Estados para envío de mails de pago por usuario
  const [paymentEmailStatus, setPaymentEmailStatus] = useState<
    Record<string, "idle" | "sending" | "success" | "error">
  >({});
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<
    Record<string, string>
  >({});

  // Estados para Carga de Pago
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetUser, setPaymentTargetUser] =
    useState<RegistrationItem | null>(null);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [isPaymentIdCopied, setIsPaymentIdCopied] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce para la búsqueda del servidor
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Al cambiar el término de búsqueda o filtro, volvemos a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearch,
        status: filterStatus,
      });
      const res = await fetch(`/api/admin/registrations?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "No se pudo obtener la lista de registros.",
        );
      }
      setList(data.list || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Traer datos del servidor cuando cambien los parámetros de paginado/filtros
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearch,
    filterStatus,
    isAuthenticated,
  ]);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/admin/auth-check");
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setIsAuthenticated(true);
          setIsDefaultPassword(!!data.isDefaultPassword);
        }
      } catch (err) {
        console.error("Error validando autenticación:", err);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuthStatus();
  }, []);

  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const fetchEventConfig = async () => {
    try {
      const res = await fetch("/api/admin/event-config");
      const data = await res.json();
      if (res.ok && data.success && data.config) {
        setEventDate(data.config.date || "");
        setEventTime(data.config.time || "");
        setTicketPrice(data.config.ticketPrice || 0);
      }
    } catch (err) {
      console.error("Error al obtener la configuración del evento:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchEventConfig();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al iniciar sesión.");
      }
      setIsAuthenticated(true);
      setIsDefaultPassword(!!data.isDefaultPassword);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth-check", { method: "POST" });
      setIsAuthenticated(false);
      setIsDefaultPassword(false);
      setList([]);
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setChangePasswordError("Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.trim().length < 4) {
      setChangePasswordError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError("");
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al actualizar la contraseña.");
      }
      setIsDefaultPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setChangePasswordError(err.message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleSaveDni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dniTargetUser) return;

    if (!dniInput.trim()) {
      setDniError("El DNI no puede estar vacío.");
      return;
    }

    setIsDniSaving(true);
    setDniError("");
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: dniTargetUser._id,
          dni: dniInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al guardar el DNI.");
      }

      setList((prevList) =>
        prevList.map((item) =>
          item._id === dniTargetUser._id
            ? { ...item, dni: data.user.dni }
            : item,
        ),
      );

      setIsDniModalOpen(false);
      setDniTargetUser(null);
      setDniInput("");
    } catch (err: any) {
      setDniError(err.message);
    } finally {
      setIsDniSaving(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigSaving(true);
    setConfigError("");
    try {
      const res = await fetch("/api/admin/event-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: eventDate,
          time: eventTime,
          ticketPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Error al guardar la configuración del evento.",
        );
      }
      setIsConfigModalOpen(false);
    } catch (err: any) {
      setConfigError(err.message);
    } finally {
      setIsConfigSaving(false);
    }
  };

  const handleSavePayment = async (paidValue: boolean) => {
    if (!paymentTargetUser) return;
    setIsPaymentSaving(true);
    setPaymentError("");
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: paymentTargetUser._id,
          paid: paidValue,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Error al actualizar el estado del pago.",
        );
      }

      setList((prevList) =>
        prevList.map((item) =>
          item._id === paymentTargetUser._id
            ? { ...item, paid: data.user.paid }
            : item,
        ),
      );

      setIsPaymentModalOpen(false);
      setPaymentTargetUser(null);
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setIsPaymentSaving(false);
    }
  };

  const handleSendEmail = async (user: RegistrationItem) => {
    setEmailStatus((prev) => ({ ...prev, [user._id]: "sending" }));
    setStatusMessage((prev) => ({ ...prev, [user._id]: "" }));

    try {
      // Enviar al backend únicamente la ID del registro
      const res = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: user._id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error enviando correo.");
      }

      setEmailStatus((prev) => ({ ...prev, [user._id]: "success" }));

      // Actualizar el estado local para que el botón refleje el cambio al instante
      setList((prevList) =>
        prevList.map((item) =>
          item._id === user._id ? { ...item, emailSent: true } : item,
        ),
      );

      if (data.mocked) {
        setStatusMessage((prev) => ({
          ...prev,
          [user._id]: "Guardado en scratch/last-email.html",
        }));
      } else {
        setStatusMessage((prev) => ({
          ...prev,
          [user._id]: "Mail enviado ✅",
        }));
      }
    } catch (err: any) {
      console.error(err);
      setEmailStatus((prev) => ({ ...prev, [user._id]: "error" }));
      setStatusMessage((prev) => ({
        ...prev,
        [user._id]: err.message || "Error",
      }));
    }
  };

  const handleSendPaymentEmail = async (user: RegistrationItem) => {
    setPaymentEmailStatus((prev) => ({ ...prev, [user._id]: "sending" }));
    setPaymentStatusMessage((prev) => ({ ...prev, [user._id]: "" }));

    try {
      const res = await fetch("/api/admin/send-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: user._id,
          itemType: "ticket",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error enviando correo de pago.");
      }

      setPaymentEmailStatus((prev) => ({ ...prev, [user._id]: "success" }));

      if (data.mocked) {
        setPaymentStatusMessage((prev) => ({
          ...prev,
          [user._id]: "Guardado en scratch/last-payment-email.html",
        }));
      } else {
        setPaymentStatusMessage((prev) => ({
          ...prev,
          [user._id]: "Mail de pago enviado ✅",
        }));
      }
    } catch (err: any) {
      console.error(err);
      setPaymentEmailStatus((prev) => ({ ...prev, [user._id]: "error" }));
      setPaymentStatusMessage((prev) => ({
        ...prev,
        [user._id]: err.message || "Error",
      }));
    }
  };

  const handleWhatsAppPayment = async (user: RegistrationItem) => {
    try {
      const res = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: user._id,
          itemType: "ticket",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Error al generar la preferencia de pago.",
        );
      }

      // La API resuelve dinámicamente si es Sandbox o Producción según el token configurado
      const paymentUrl = data.paymentUrl;

      const message = encodeURIComponent(
        `¡Hola ${user.fullName}! Te dejamos el link para completar el pago de tu entrada: ${paymentUrl} una vez pagado, espera 5 segundos a que mercado pago te redirija a nuestra pagina para confirmar el pago o toca en el link que te proporcionan ellos`,
      );

      const whatsappPhone = user.whatsapp.replace(/\+/g, "").trim();
      window.open(`https://wa.me/${whatsappPhone}?text=${message}`, "_blank");
    } catch (err: any) {
      console.error("Error en WhatsApp Pago:", err);
      alert("Error al generar el link de WhatsApp: " + err.message);
    }
  };

  const handleDeleteDatabase = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al borrar la base de datos.");
      }
      setList([]);
      setIsDeleteOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetStatuses = async () => {
    setIsResetting(true);
    setResetError("");
    try {
      const res = await fetch("/api/admin/reset-status", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Error al reiniciar los estados de los invitados.",
        );
      }
      setIsResetModalOpen(false);
      fetchData();
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!singleDeleteTargetUser) return;
    setIsSingleDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/registrations?id=${singleDeleteTargetUser._id}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al borrar el registro.");
      }

      setList((prevList) =>
        prevList.filter((item) => item._id !== singleDeleteTargetUser._id),
      );
      setTotalItems((prev) => Math.max(0, prev - 1));
      setIsSingleDeleteOpen(false);
      setSingleDeleteTargetUser(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSingleDeleting(false);
    }
  };

  // Buscar usuario escaneado por su token
  const handleFetchScannedUser = async (token: string) => {
    setIsFetchScannedLoading(true);
    setScanError("");
    try {
      const res = await fetch(
        `/api/admin/scan?qrToken=${encodeURIComponent(token)}`,
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Código QR no registrado.");
      }
      setScannedUser(data.user);
    } catch (err: any) {
      setScanError(err.message);
      setScannedUser(null);
    } finally {
      setIsFetchScannedLoading(false);
    }
  };

  // Registrar asistencia en DB
  const handleRegisterAttendance = async (attended: boolean) => {
    if (!scannedUser) return;
    setIsAttendanceLoading(true);
    try {
      const res = await fetch("/api/admin/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: scannedUser._id,
          attended,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al registrar la asistencia.");
      }

      // Actualizar la lista en memoria para reflejar la asistencia
      setList((prevList) =>
        prevList.map((item) =>
          item._id === scannedUser._id ? { ...item, attended } : item,
        ),
      );

      // Cerrar modal de confirmación
      setScannedUser(null);
    } catch (err: any) {
      setScanError(err.message);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  // Inicialización y limpieza del escáner por cámara
  useEffect(() => {
    let activeScanner: any = null;

    const initScanner = async () => {
      if (!isScannerOpen) return;
      try {
        setScanError("");
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("reader");
        activeScanner = scanner;
        setHtml5QrCodeInstance(scanner);

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          async (decodedText) => {
            activeScanner = null;
            try {
              await scanner.stop();
            } catch (err) {
              console.warn("Escáner ya detenido:", err);
            }
            setHtml5QrCodeInstance(null);
            setIsScannerOpen(false);
            handleFetchScannedUser(decodedText);
          },
          () => {},
        );
      } catch (err: any) {
        console.error("Error iniciando escáner:", err);
        setScanError(err.message || "No se pudo acceder a la cámara.");
      }
    };

    if (isScannerOpen) {
      initScanner();
    }

    return () => {
      if (activeScanner) {
        activeScanner.stop().catch(() => {});
      }
    };
  }, [isScannerOpen]);

  // Ya no filtramos ni paginamos en el cliente, la API se encarga de todo en el servidor.
  const filteredList = list;
  const paginatedList = list;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;

  if (isAuthChecking) {
    return (
      <main className="min-h-screen bg-spotify-black text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-spotify-accent" size={32} />
        <p className="text-spotify-text-secondary text-sm font-medium">
          Verificando sesión...
        </p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-spotify-black text-white flex items-center justify-center p-4">
        <div className="bg-spotify-surface border border-white/10 max-w-sm w-full rounded-2xl p-6 spotify-shadow-heavy">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-spotify-accent/10 border border-spotify-accent/20 rounded-full flex items-center justify-center text-spotify-accent">
              <Lock size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-center">
              Local Social Club Admin
            </h1>
            <p className="text-spotify-text-secondary text-xs text-center">
              Ingresá tus credenciales para acceder al panel.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1.5 pl-1">
                Usuario
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-spotify-text-secondary">
                  <User size={14} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-spotify-button hover:bg-spotify-card border border-white/10 focus:border-white/20 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-spotify-text-secondary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1.5 pl-1">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-spotify-text-secondary">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-spotify-button hover:bg-spotify-card border border-white/10 focus:border-white/20 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-spotify-text-secondary focus:outline-none transition-colors"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-[11px] text-spotify-error bg-spotify-error/10 border border-spotify-error/20 p-2.5 rounded-lg font-medium text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full flex items-center justify-center gap-2 bg-spotify-accent hover:opacity-90 active:scale-95 text-white py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 mt-2"
            >
              {loginLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-spotify-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Cabecera del Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Panel de Administración
            </h1>
            <p className="text-spotify-text-secondary text-sm">
              Lista de solicitudes completadas y control de accesos QR.
            </p>
            {(eventDate || eventTime) && (
              <p className="text-spotify-text-primary text-xs font-bold mt-2.5 flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full w-fit">
                <Calendar
                  size={13}
                  className="text-spotify-text-primary flex-shrink-0"
                />
                <span>
                  Evento: {eventDate ? getFormattedDate(eventDate) : "-"}{" "}
                  {eventTime ? `a las ${eventTime} hs` : ""}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-spotify-button hover:bg-spotify-card border border-white/10 px-4 py-2.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors w-full sm:w-auto whitespace-nowrap"
            >
              <Calendar size={14} className="flex-shrink-0" />
              actualizar fecha y hora
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-spotify-button hover:bg-spotify-card border border-white/10 px-4 py-2.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 w-full sm:w-auto whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="animate-spin flex-shrink-0" size={14} />
              ) : (
                <RefreshCw size={14} className="flex-shrink-0" />
              )}
              actualizar lista
            </button>
            {/* <button
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center justify-center gap-2 bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 hover:border-red-500/40 text-red-400 px-4 py-2.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors w-full sm:w-auto whitespace-nowrap"
            >
              <Trash2 size={14} className="flex-shrink-0" />
              Limpiar BD
            </button> */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 hover:border-red-500/50 text-red-400 px-4 py-2.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors w-full sm:w-auto whitespace-nowrap"
            >
              <LogOut size={14} className="flex-shrink-0" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-spotify-error/10 border border-spotify-error/30 text-spotify-error p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Controles de Búsqueda, Filtrado y Borrado (Siempre visibles) */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Buscador */}
            <div className="relative flex-1 max-w-lg">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="text-spotify-text-secondary" size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por instagram, whatsapp, email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-spotify-button hover:bg-spotify-card border border-white/10 focus:border-white/20 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-spotify-text-secondary focus:outline-none transition-colors"
              />
            </div>

            {/* Filtro y Borrar BD */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(
                    e.target.value as
                      | "all"
                      | "sent"
                      | "pending"
                      | "attended"
                      | "not-attended",
                  );
                  setCurrentPage(1);
                }}
                className="bg-spotify-button hover:bg-spotify-card border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-spotify-text-near focus:outline-none transition-colors cursor-pointer"
              >
                <option value="all">TODOS LOS REGISTROS</option>
                <option value="pending">PENDIENTES</option>
                <option value="sent">MAILS ENVIADOS</option>
                <option value="attended">VINO</option>
                <option value="not-attended">NO VINO</option>
              </select>

              <button
                onClick={() => setIsResetModalOpen(true)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5"
                title="Reiniciar todos los estados del evento"
              >
                <RefreshCw size={13} />
                Reiniciar Estados
              </button>

              {filterStatus === "sent" && (
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-1.5 bg-spotify-accent hover:opacity-90 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                >
                  <Camera size={13} />
                  Escanear QR
                </button>
              )}
            </div>
          </div>

          {/* Estado de Carga o Resultados */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-spotify-surface rounded-xl border border-white/5 spotify-shadow-medium">
              <Loader2 className="animate-spin text-spotify-accent" size={32} />
              <p className="text-spotify-text-secondary text-sm">
                Cargando registros...
              </p>
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-20 bg-spotify-surface rounded-xl border border-white/5 spotify-shadow-medium">
              <p className="text-spotify-text-secondary text-base">
                {searchQuery.trim() !== "" || filterStatus !== "all"
                  ? "No se encontraron registros que coincidan con la búsqueda."
                  : "No hay solicitudes cargadas todavía."}
              </p>
            </div>
          ) : (
            <div className="bg-spotify-surface rounded-xl overflow-hidden border border-white/5 spotify-shadow-heavy">
              {/* Vista Web (Tabla) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/20 text-xs font-bold uppercase tracking-wider text-spotify-text-secondary">
                      <th className="p-3 pl-4">nombre / ig</th>
                      <th className="p-3">whatsapp</th>
                      <th className="p-3">email</th>
                      <th className="p-3">dni</th>
                      <th className="p-3 text-center">fecha nac.</th>
                      <th className="p-3">ubicación</th>
                      <th className="p-3">referencia</th>
                      <th className="p-3 text-center">pagado</th>
                      <th className="p-3 text-center">estado</th>
                      <th className="p-3 pr-4 text-center">acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-spotify-text-near">
                    {paginatedList.map((user) => {
                      const status = emailStatus[user._id] || "idle";
                      const statusMsg = statusMessage[user._id] || "";
                      const paymentStatus =
                        paymentEmailStatus[user._id] || "idle";
                      const paymentMsg = paymentStatusMessage[user._id] || "";

                      return (
                        <tr
                          key={user._id}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Nombre y Link de Instagram */}
                          <td className="p-3 pl-4 font-semibold text-white whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-white font-bold">
                                {user.fullName || "Sin Nombre"}
                              </span>
                              <a
                                href={`https://instagram.com/${user.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] text-spotify-text-secondary hover:text-spotify-accent transition-colors"
                              >
                                @{user.instagram}
                                <ExternalLink
                                  size={10}
                                  className="opacity-50"
                                />
                              </a>
                            </div>
                          </td>

                          {/* WhatsApp Link */}
                          <td className="p-3 whitespace-nowrap">
                            <a
                              href={`https://wa.me/${user.whatsapp.replace(/\+/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-spotify-accent transition-colors"
                            >
                              {user.whatsapp}
                              <ExternalLink size={12} className="opacity-50" />
                            </a>
                          </td>

                          {/* Email */}
                          <td
                            className="p-3 whitespace-nowrap"
                            title={user.email}
                          >
                            {user.email}
                          </td>

                          {/* DNI */}
                          <td className="p-3 font-semibold text-white/90 whitespace-nowrap">
                            {user.dni || "-"}
                          </td>

                          {/* Fecha de Nacimiento */}
                          <td className="p-3 text-center whitespace-nowrap">
                            {user.dob}
                          </td>

                          {/* Ubicación */}
                          <td className="p-3 whitespace-nowrap">
                            {user.location}
                          </td>

                          {/* Cómo nos conoció */}
                          <td
                            className="p-3 max-w-[100px] truncate"
                            title={user.referral}
                          >
                            {user.referral}
                          </td>

                          {/* Pago */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setPaymentTargetUser(user);
                                setIsPaymentModalOpen(true);
                              }}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all active:scale-95 uppercase tracking-wider ${
                                user.paid
                                  ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                              }`}
                            >
                              {user.paid ? "pagado" : "Pendiente"}
                            </button>
                          </td>

                          {/* Estado (Pendiente, Vino, No vino) */}
                          <td className="p-3 text-center whitespace-nowrap">
                            {!user.emailSent ? (
                              <span className="bg-white/5 text-white/40 border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Pendiente
                              </span>
                            ) : user.attended ? (
                              <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Vino
                              </span>
                            ) : (
                              <span className="bg-white/5 text-white/30 border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                No Vino
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="p-3 pr-4 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center justify-center gap-1 min-w-[100px]">
                              {!user.dni ? (
                                <button
                                  onClick={() => {
                                    setDniTargetUser(user);
                                    setDniInput("");
                                    setIsDniModalOpen(true);
                                  }}
                                  className="bg-spotify-accent hover:opacity-90 active:scale-95 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
                                >
                                  Cargar DNI
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleSendEmail(user)}
                                    disabled={
                                      status === "sending" || !user.paid
                                    }
                                    className={`flex items-center justify-center gap-1 w-full ${
                                      user.emailSent
                                        ? "bg-white/10 hover:bg-white/20 text-white/60 border border-white/10"
                                        : user.paid
                                          ? "bg-spotify-accent hover:opacity-90 text-white"
                                          : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                                    } disabled:opacity-50 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95`}
                                  >
                                    {status === "sending" ? (
                                      <Loader2
                                        className="animate-spin"
                                        size={10}
                                      />
                                    ) : (
                                      <Mail size={10} />
                                    )}
                                    {user.emailSent
                                      ? "Reenviar"
                                      : "Enviar Mail"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDniTargetUser(user);
                                      setDniInput(user.dni || "");
                                      setIsDniModalOpen(true);
                                    }}
                                    className="text-[9px] text-spotify-text-secondary hover:text-white transition-colors underline"
                                  >
                                    Editar DNI
                                  </button>
                                </>
                              )}

                              {/* Cobros Mercado Pago */}
                              {!user.paid && (
                                <div className="w-full border-t border-white/5 my-1 pt-1 space-y-1">
                                  <button
                                    onClick={() => handleSendPaymentEmail(user)}
                                    disabled={paymentStatus === "sending"}
                                    className="flex items-center justify-center gap-1 w-full bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95"
                                  >
                                    {paymentStatus === "sending" ? (
                                      <Loader2
                                        className="animate-spin"
                                        size={8}
                                      />
                                    ) : (
                                      <Mail size={8} />
                                    )}
                                    Mail Pago
                                  </button>

                                  <button
                                    onClick={() => handleWhatsAppPayment(user)}
                                    className="flex items-center justify-center gap-1 w-full bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95"
                                  >
                                    WSP Pago
                                  </button>
                                </div>
                              )}

                              {user.emailSent && status === "idle" && (
                                <span className="text-[9px] text-green-400 font-medium">
                                  Enviado
                                </span>
                              )}

                              {statusMsg && (
                                <span
                                  className={`text-[9px] mt-0.5 font-medium ${
                                    status === "success"
                                      ? "text-green-400"
                                      : status === "error"
                                        ? "text-spotify-error"
                                        : "text-spotify-text-secondary"
                                  }`}
                                >
                                  {statusMsg}
                                </span>
                              )}

                              {paymentMsg && (
                                <span
                                  className={`text-[9px] mt-0.5 font-medium ${
                                    paymentStatus === "success"
                                      ? "text-green-400"
                                      : paymentStatus === "error"
                                        ? "text-spotify-error"
                                        : "text-spotify-text-secondary"
                                  }`}
                                >
                                  {paymentMsg}
                                </span>
                              )}

                              <button
                                onClick={() => {
                                  setSingleDeleteTargetUser(user);
                                  setIsSingleDeleteOpen(true);
                                }}
                                className="flex items-center justify-center gap-1 mt-1 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all"
                                title="Eliminar Registro"
                              >
                                <Trash2 size={10} />
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista Mobile (Tarjetas/Filas) */}
              <div className="md:hidden divide-y divide-white/5">
                {paginatedList.map((user) => {
                  const status = emailStatus[user._id] || "idle";
                  const statusMsg = statusMessage[user._id] || "";
                  const paymentStatus = paymentEmailStatus[user._id] || "idle";
                  const paymentMsg = paymentStatusMessage[user._id] || "";

                  return (
                    <div
                      key={user._id}
                      className="p-5 space-y-4 hover:bg-white/[0.01] transition-colors"
                    >
                      {/* Fila superior: Nombre, Instagram & Estado */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h2 className="text-white font-bold text-base leading-tight">
                            {user.fullName || "Sin Nombre"}
                          </h2>
                          <a
                            href={`https://instagram.com/${user.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-spotify-text-secondary hover:text-spotify-accent text-xs mt-1 transition-colors truncate"
                          >
                            @{user.instagram}
                            <ExternalLink
                              size={11}
                              className="opacity-50 flex-shrink-0"
                            />
                          </a>
                          <p className="text-spotify-text-secondary text-[11px] mt-1">
                            Nac: {user.dob} • {user.location}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {!user.emailSent ? (
                            <span className="bg-white/5 text-white/40 border border-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Pendiente
                            </span>
                          ) : user.attended ? (
                            <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Vino
                            </span>
                          ) : (
                            <span className="bg-white/5 text-white/30 border border-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              No vino
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Detalles de contacto */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-spotify-text-near bg-black/10 p-3 rounded-lg">
                        <div>
                          <span className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-0.5">
                            WhatsApp
                          </span>
                          <a
                            href={`https://wa.me/${user.whatsapp.replace(/\+/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-spotify-accent transition-colors font-medium break-all"
                          >
                            {user.whatsapp}
                          </a>
                        </div>
                        <div>
                          <span className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-0.5">
                            Email
                          </span>
                          <span className="break-all font-medium">
                            {user.email}
                          </span>
                        </div>
                        <div className="col-span-2 border-t border-white/5 pt-2 mt-1">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-0.5">
                                DNI
                              </span>
                              <span className="font-semibold text-white">
                                {user.dni || "No cargado"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-0.5">
                                Pago
                              </span>
                              <button
                                onClick={() => {
                                  setPaymentTargetUser(user);
                                  setIsPaymentModalOpen(true);
                                }}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all active:scale-95 uppercase tracking-wider ${
                                  user.paid
                                    ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                                    : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                                }`}
                              >
                                {user.paid ? "pagado ✅" : "Pendiente"}
                              </button>
                            </div>
                            <div className="min-w-0 max-w-[120px]">
                              <span className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-0.5">
                                Referencia
                              </span>
                              <p
                                className="italic text-spotify-text-secondary truncate"
                                title={user.referral}
                              >
                                "{user.referral}"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botón de acción */}
                      <div className="flex flex-col gap-2 pt-1">
                        {!user.dni ? (
                          <button
                            onClick={() => {
                              setDniTargetUser(user);
                              setDniInput("");
                              setIsDniModalOpen(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-spotify-accent hover:opacity-90 active:scale-95 text-white py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                          >
                            Cargar DNI
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSendEmail(user)}
                              disabled={status === "sending" || !user.paid}
                              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                                user.emailSent
                                  ? "bg-white/10 hover:bg-white/20 text-white/70 border border-white/10"
                                  : user.paid
                                    ? "bg-spotify-accent hover:opacity-90 text-white"
                                    : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                              }`}
                            >
                              {status === "sending" ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <Mail size={14} />
                              )}
                              {user.emailSent ? "Reenviar Mail" : "Enviar Mail"}
                            </button>
                            <button
                              onClick={() => {
                                setDniTargetUser(user);
                                setDniInput(user.dni || "");
                                setIsDniModalOpen(true);
                              }}
                              className="w-full text-center text-spotify-text-secondary hover:text-white transition-colors text-xs font-bold uppercase tracking-wider py-1"
                            >
                              Editar DNI
                            </button>
                          </>
                        )}

                        {/* Cobros Mercado Pago */}
                        {!user.paid && (
                          <div className="flex gap-2 w-full mt-1">
                            <button
                              onClick={() => handleSendPaymentEmail(user)}
                              disabled={paymentStatus === "sending"}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                            >
                              {paymentStatus === "sending" ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <Mail size={12} />
                              )}
                              Mail Pago
                            </button>

                            <button
                              onClick={() => handleWhatsAppPayment(user)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                            >
                              WSP Pago
                            </button>
                          </div>
                        )}

                        {statusMsg && (
                          <span
                            className={`text-center text-[10px] mt-1 font-medium ${
                              status === "success"
                                ? "text-green-400"
                                : status === "error"
                                  ? "text-spotify-error"
                                  : "text-spotify-text-secondary"
                            }`}
                          >
                            {statusMsg}
                          </span>
                        )}

                        {paymentMsg && (
                          <span
                            className={`text-center text-[10px] mt-1 font-medium ${
                              paymentStatus === "success"
                                ? "text-green-400"
                                : paymentStatus === "error"
                                  ? "text-spotify-error"
                                  : "text-spotify-text-secondary"
                            }`}
                          >
                            {paymentMsg}
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setSingleDeleteTargetUser(user);
                            setIsSingleDeleteOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-red-400/80 hover:text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 transition-all active:scale-95 mt-1"
                        >
                          <Trash2 size={13} />
                          Eliminar Registro
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-white/5 bg-black/10 text-sm">
                  <span className="text-spotify-text-secondary text-xs">
                    Mostrando {startIndex + 1} -{" "}
                    {Math.min(startIndex + itemsPerPage, totalItems)} de{" "}
                    {totalItems} registros
                  </span>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-spotify-text-secondary font-bold">
                      <span>MOSTRAR:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-spotify-button hover:bg-spotify-card border border-white/10 rounded-full px-2 py-1 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={validCurrentPage === 1}
                        className="flex items-center gap-1 bg-spotify-button hover:bg-spotify-card border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ChevronLeft size={14} />
                        Anterior
                      </button>
                      <span className="text-xs font-bold text-white px-2">
                        Página {validCurrentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={validCurrentPage === totalPages}
                        className="flex items-center gap-1 bg-spotify-button hover:bg-spotify-card border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      >
                        Siguiente
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación para reiniciar estados */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-spotify-surface border border-white/10 max-w-md w-full rounded-2xl p-6 spotify-shadow-heavy">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RefreshCw size={18} className="text-red-500" />
              ¿Reiniciar estados del evento?
            </h2>
            <p className="text-spotify-text-secondary text-xs mb-6 leading-relaxed">
              Esta acción restablecerá el estado de{" "}
              <strong>pago, mails enviados y asistencia</strong> a pendiente
              para todos los invitados. También se eliminarán los registros de
              transacción (paymentId). Los datos personales de los invitados no
              serán alterados. Esta acción no se puede deshacer.
            </p>

            {resetError && (
              <div className="text-[11px] text-spotify-error bg-spotify-error/10 border border-spotify-error/20 p-2.5 rounded-lg font-medium text-center mb-4">
                {resetError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetError("");
                }}
                disabled={isResetting}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetStatuses}
                disabled={isResetting}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="animate-spin" size={12} />
                    Reiniciando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={12} />
                    Sí, reiniciar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para borrar base de datos */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-spotify-surface border border-white/10 max-w-md w-full rounded-2xl p-6 spotify-shadow-heavy">
            <h2 className="text-lg font-bold text-white mb-2">
              ¿Borrar base de datos?
            </h2>
            <p className="text-spotify-text-secondary text-xs mb-6 leading-relaxed">
              Esta acción eliminará de forma permanente **todos** los registros
              de solicitudes y códigos QR asociados en MongoDB. Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteDatabase}
                disabled={isDeleting}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin" size={12} />
                    Borrando...
                  </>
                ) : (
                  <>
                    <Trash2 size={12} />
                    Sí, borrar todo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado de un único registro */}
      {isSingleDeleteOpen && singleDeleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-spotify-surface border border-white/10 max-w-sm w-full rounded-2xl p-6 spotify-shadow-heavy">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 size={18} className="text-red-500" />
              ¿Borrar registro?
            </h2>
            <p className="text-spotify-text-secondary text-xs mb-6 leading-relaxed">
              ¿Estás seguro de que querés eliminar permanentemente el registro
              de{" "}
              <strong className="text-white">
                {singleDeleteTargetUser.fullName || "Sin Nombre"}
              </strong>{" "}
              (@{singleDeleteTargetUser.instagram})? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsSingleDeleteOpen(false);
                  setSingleDeleteTargetUser(null);
                }}
                disabled={isSingleDeleting}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSingle}
                disabled={isSingleDeleting}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isSingleDeleting ? (
                  <>
                    <Loader2 className="animate-spin" size={12} />
                    Borrando...
                  </>
                ) : (
                  <>Sí, borrar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Escaneo de QR */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-spotify-surface border border-white/10 max-w-sm w-full rounded-2xl p-6 spotify-shadow-heavy flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Camera size={16} className="text-spotify-text-secondary" />
                Escáner QR
              </h2>
              <button
                onClick={() => setIsScannerOpen(false)}
                className="text-spotify-text-secondary hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden border border-white/10 mb-4">
              <div id="reader" className="w-full h-full"></div>
              {/* Focus frame overlay */}
              <div className="absolute inset-0 border-[20px] border-black/40 pointer-events-none flex items-center justify-center">
                <div className="w-[180px] h-[180px] border-2 border-dashed border-white/20 rounded-lg"></div>
              </div>
            </div>

            {scanError && (
              <p className="text-spotify-error text-xs text-center font-medium mb-4 bg-spotify-error/10 border border-spotify-error/20 p-2.5 rounded-lg w-full">
                {scanError}
              </p>
            )}

            <p className="text-spotify-text-secondary text-[11px] text-center leading-relaxed">
              Enfocá el código QR del invitado con la cámara de tu celular.
            </p>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Asistencia */}
      {(scannedUser ||
        isFetchScannedLoading ||
        (scanError && !isScannerOpen)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-spotify-surface border border-white/10 max-w-md w-full rounded-2xl p-6 spotify-shadow-heavy">
            {isFetchScannedLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2
                  className="animate-spin text-spotify-accent"
                  size={32}
                />
                <p className="text-spotify-text-secondary text-sm font-medium">
                  Buscando registro en la base de datos...
                </p>
              </div>
            ) : scanError ? (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-spotify-error">
                  Error al escanear
                </h2>
                <p className="text-spotify-text-secondary text-sm bg-spotify-error/10 border border-spotify-error/20 p-3 rounded-lg">
                  {scanError}
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setScanError("");
                      setScannedUser(null);
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : scannedUser ? (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  🎟️ Datos del Invitado
                </h2>

                <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-spotify-text-secondary">Nombre:</span>
                    <span className="font-bold text-white">
                      {scannedUser.fullName || "Sin Nombre"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-spotify-text-secondary">
                      Instagram:
                    </span>
                    <span className="font-bold text-white">
                      @{scannedUser.instagram}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-spotify-text-secondary">
                      WhatsApp:
                    </span>
                    <span className="font-medium text-white">
                      {scannedUser.whatsapp}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-spotify-text-secondary">Email:</span>
                    <span className="font-medium text-white break-all">
                      {scannedUser.email}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-spotify-text-secondary">
                      Fecha Nac.:
                    </span>
                    <span className="font-medium text-white">
                      {scannedUser.dob}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-spotify-text-secondary">
                      Ubicación:
                    </span>
                    <span className="font-medium text-white">
                      {scannedUser.location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-spotify-text-secondary">
                      Referencia:
                    </span>
                    <span className="font-medium text-white italic">
                      "{scannedUser.referral}"
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <div className="flex justify-between items-center gap-3">
                    <button
                      onClick={() => handleRegisterAttendance(false)}
                      disabled={isAttendanceLoading}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      No Vino
                    </button>
                    <button
                      onClick={() => handleRegisterAttendance(true)}
                      disabled={isAttendanceLoading}
                      className="flex-1 bg-spotify-accent hover:opacity-90 text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isAttendanceLoading && (
                        <Loader2 className="animate-spin" size={12} />
                      )}
                      Vino
                    </button>
                  </div>
                  <button
                    onClick={() => setScannedUser(null)}
                    disabled={isAttendanceLoading}
                    className="w-full text-center text-spotify-text-secondary hover:text-white transition-colors text-xs font-bold uppercase tracking-wider py-1.5 mt-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal para Carga/Edición de DNI */}
      {isDniModalOpen && dniTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-spotify-surface border border-white/10 max-w-sm w-full rounded-2xl p-6 spotify-shadow-heavy">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-spotify-accent/10 border border-spotify-accent/20 rounded-full flex items-center justify-center text-spotify-accent">
                <User size={20} />
              </div>
              <h2 className="text-lg font-bold text-white text-center">
                📋 Cargar DNI del Invitado
              </h2>
              <p className="text-spotify-text-secondary text-xs text-center">
                Ingresá el documento para{" "}
                <strong>{dniTargetUser.fullName || "Sin Nombre"}</strong> (@
                {dniTargetUser.instagram})
              </p>
            </div>

            <form onSubmit={handleSaveDni} className="space-y-4">
              <div>
                <label className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1.5 pl-1">
                  Número de DNI
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 42098123"
                  value={dniInput}
                  onChange={(e) => setDniInput(e.target.value)}
                  className="w-full bg-spotify-button hover:bg-spotify-card border border-white/10 focus:border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder-spotify-text-secondary focus:outline-none transition-colors"
                />
              </div>

              {dniError && (
                <div className="text-[11px] text-spotify-error bg-spotify-error/10 border border-spotify-error/20 p-2.5 rounded-lg font-medium text-center">
                  {dniError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDniModalOpen(false);
                    setDniTargetUser(null);
                    setDniInput("");
                  }}
                  disabled={isDniSaving}
                  className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDniSaving}
                  className="bg-spotify-accent hover:opacity-90 active:scale-95 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isDniSaving && (
                    <Loader2 className="animate-spin" size={12} />
                  )}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Registro/Edición de Pago */}
      {isPaymentModalOpen && paymentTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-spotify-surface border border-white/10 max-w-sm w-full rounded-2xl p-6 spotify-shadow-heavy">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-spotify-accent/10 border border-spotify-accent/20 rounded-full flex items-center justify-center text-[#f6ebdd] text-lg font-bold">
                $
              </div>
              <h2 className="text-lg font-bold text-white text-center">
                ¿Este usuario pagó?
              </h2>
              <p className="text-spotify-text-secondary text-xs text-center leading-relaxed">
                Modificando estado de pago para{" "}
                <strong>{paymentTargetUser.fullName || "Sin Nombre"}</strong> (@
                {paymentTargetUser.instagram})
              </p>

              {paymentTargetUser.paymentId && (
                <div className="w-full bg-black/35 border border-white/5 p-3 rounded-xl mt-3 text-left space-y-1">
                  <span className="block text-spotify-text-secondary uppercase font-bold text-[9px] tracking-wider">
                    Operación Mercado Pago
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-white font-mono font-semibold text-[11px] select-all break-all leading-tight">
                      {paymentTargetUser.paymentId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          paymentTargetUser.paymentId || "",
                        );
                        setIsPaymentIdCopied(true);
                        setTimeout(() => setIsPaymentIdCopied(false), 2000);
                      }}
                      className={`text-[10px] hover:underline font-bold uppercase tracking-wider flex-shrink-0 transition-colors ${
                        isPaymentIdCopied
                          ? "text-green-400 font-extrabold"
                          : "text-spotify-text-primary"
                      }`}
                    >
                      {isPaymentIdCopied ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {paymentError && (
              <div className="text-[11px] text-spotify-error bg-spotify-error/10 border border-spotify-error/20 p-2.5 rounded-lg font-medium text-center mb-4">
                {paymentError}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center gap-3">
                <button
                  onClick={() => handleSavePayment(false)}
                  disabled={isPaymentSaving}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  No
                </button>
                <button
                  onClick={() => handleSavePayment(true)}
                  disabled={isPaymentSaving}
                  className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isPaymentSaving && (
                    <Loader2 className="animate-spin" size={12} />
                  )}
                  Sí
                </button>
              </div>

              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentTargetUser(null);
                  setPaymentError("");
                  setIsPaymentIdCopied(false);
                }}
                disabled={isPaymentSaving}
                className="w-full text-center text-spotify-text-secondary hover:text-white transition-colors text-xs font-bold uppercase tracking-wider py-1.5 mt-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Obligatorio de Cambio de Contraseña */}
      {isDefaultPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-spotify-surface border border-white/10 max-w-sm w-full rounded-2xl p-6 spotify-shadow-heavy">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-spotify-accent/10 border border-spotify-accent/20 rounded-full flex items-center justify-center text-spotify-accent">
                <Lock size={20} className="animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-white text-center">
                🔒 Cambiar Contraseña Obligatorio
              </h2>
              <p className="text-spotify-text-secondary text-[11px] text-center leading-relaxed">
                Por motivos de seguridad, tenés que cambiar la contraseña por
                defecto (
                <span className="text-white font-mono font-bold">admin</span>)
                antes de acceder al panel.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1.5 pl-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-spotify-text-secondary">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={4}
                    placeholder="Contraseña nueva"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-spotify-button hover:bg-spotify-card border border-white/10 focus:border-white/20 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-spotify-text-secondary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1.5 pl-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-spotify-text-secondary">
                    <Check size={14} />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-spotify-button hover:bg-spotify-card border border-white/10 focus:border-white/20 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-spotify-text-secondary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {changePasswordError && (
                <div className="text-[11px] text-spotify-error bg-spotify-error/10 border border-spotify-error/20 p-2.5 rounded-lg font-medium text-center">
                  {changePasswordError}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="w-full flex items-center justify-center gap-2 bg-spotify-accent hover:opacity-90 active:scale-95 text-white py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {changePasswordLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    "Guardar y Continuar"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-center text-spotify-text-secondary hover:text-white transition-colors text-xs font-bold uppercase tracking-wider py-1.5 mt-1"
                >
                  Cancelar / Cerrar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Configuración de Fecha y Hora del Evento */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-spotify-surface border border-white/10 max-w-sm w-full rounded-2xl p-6 spotify-shadow-heavy">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-spotify-accent/10 border border-spotify-accent/20 rounded-full flex items-center justify-center text-spotify-accent">
                <Calendar size={20} />
              </div>
              <h2 className="text-lg font-bold text-white text-center">
                📅 Configurar Fecha y Hora
              </h2>
              <p className="text-spotify-text-secondary text-xs text-center">
                Establecé la fecha y hora del evento para incluir en los correos
                de invitación.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1.5 pl-1">
                  Fecha del Evento
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-spotify-button hover:bg-spotify-card border border-white/10 focus:border-white/20 rounded-full px-4 py-2.5 text-xs text-white focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1.5 pl-1">
                  Hora del Evento
                </label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full bg-spotify-button hover:bg-spotify-card border border-white/10 focus:border-white/20 rounded-full px-4 py-2.5 text-xs text-white focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-spotify-text-secondary text-[10px] uppercase font-bold tracking-wider mb-1.5 pl-1">
                  Precio de Entrada ($)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="Ej: 1500"
                  value={ticketPrice || ""}
                  onChange={(e) => setTicketPrice(Number(e.target.value))}
                  className="w-full bg-spotify-button hover:bg-spotify-card border border-white/10 focus:border-white/20 rounded-full px-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
                />
              </div>

              {configError && (
                <div className="text-[11px] text-spotify-error bg-spotify-error/10 border border-spotify-error/20 p-2.5 rounded-lg font-medium text-center">
                  {configError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfigModalOpen(false);
                    setConfigError("");
                  }}
                  disabled={isConfigSaving}
                  className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isConfigSaving}
                  className="bg-spotify-accent hover:opacity-90 active:scale-95 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isConfigSaving && (
                    <Loader2 className="animate-spin" size={12} />
                  )}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
