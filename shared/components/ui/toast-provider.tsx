"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          background: "white",
          border: "1px solid #e5e7eb",
          color: "#111827",
        },
        className: "toast",
        descriptionClassName: "toast-description",
        actionButtonStyle: {
          background: "#3b82f6",
          color: "white",
        },
        cancelButtonStyle: {
          background: "#6b7280",
          color: "white",
        },
      }}
    />
  );
}
