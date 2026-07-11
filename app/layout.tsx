import "./globals.css";
import React from "react";

export const metadata = {
  title: "Local Social Club",
  description:
    "Completa tu solicitud para ingresar al club y obtené tu código QR único.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
