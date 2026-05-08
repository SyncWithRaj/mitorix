"use client";

import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#161b22",
            color: "#c9d1d9",
            border: "1px solid #30363d",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 500,
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          },
          success: {
            iconTheme: { primary: "#2ea043", secondary: "#161b22" },
            duration: 3500,
          },
          error: {
            iconTheme: { primary: "#f85149", secondary: "#161b22" },
            duration: 5000,
          },
          loading: {
            iconTheme: { primary: "#58a6ff", secondary: "#161b22" },
            duration: 4000,
          },
        }}
      />
    </>
  );
}
