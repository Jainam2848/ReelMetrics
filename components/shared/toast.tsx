"use client";

import React, { createContext, useState, useContext, useCallback } from "react";
import { AnimatePresence, m } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      dismiss(id);
    }, 4000);
  }, [dismiss]);

  const success = useCallback((msg: string) => show("success", msg), [show]);
  const error = useCallback((msg: string) => show("error", msg), [show]);
  const info = useCallback((msg: string) => show("info", msg), [show]);

  return (
    <ToastContext.Provider value={{ success, error, info, dismiss }}>
      {children}
      
      {/* Toast List Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <m.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-glass bg-glass backdrop-blur-lg shadow-glow text-white overflow-hidden"
              style={{ willChange: "transform, opacity" }}
            >
              {/* Type Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === "success" && (
                  <CheckCircle className="w-5 h-5 text-brand-secondary" />
                )}
                {toast.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
                {toast.type === "info" && (
                  <Info className="w-5 h-5 text-brand-primary" />
                )}
              </div>

              {/* Message text */}
              <div className="flex-grow text-sm font-medium tracking-wide">
                {toast.message}
              </div>

              {/* Close Button */}
              <button
                onClick={() => dismiss(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-white p-0.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
