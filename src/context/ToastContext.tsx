"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global event bus so toast can be called directly without needing useToast hook everywhere
type ToastListener = (toast: Omit<ToastItem, "id">) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    listeners.forEach((listener) => listener({ type: "success", message, title, duration }));
  },
  error: (message: string, title?: string, duration?: number) => {
    listeners.forEach((listener) => listener({ type: "error", message, title, duration }));
  },
  warning: (message: string, title?: string, duration?: number) => {
    listeners.forEach((listener) => listener({ type: "warning", message, title, duration }));
  },
  info: (message: string, title?: string, duration?: number) => {
    listeners.forEach((listener) => listener({ type: "info", message, title, duration }));
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // Subscribe to global toast calls
  useEffect(() => {
    const handleGlobalToast: ToastListener = (toastData) => {
      addToast(toastData);
    };
    listeners.add(handleGlobalToast);
    return () => {
      listeners.delete(handleGlobalToast);
    };
  }, [addToast]);

  const toastMethods = {
    success: (message: string, title?: string, duration?: number) =>
      addToast({ type: "success", message, title, duration }),
    error: (message: string, title?: string, duration?: number) =>
      addToast({ type: "error", message, title, duration }),
    warning: (message: string, title?: string, duration?: number) =>
      addToast({ type: "warning", message, title, duration }),
    info: (message: string, title?: string, duration?: number) =>
      addToast({ type: "info", message, title, duration }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastMethods }}>
      {children}
      {/* Toast Overlay Container */}
      <aside
        aria-label="Thông báo hệ thống"
        className="fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-4 sm:px-0 pointer-events-none select-none"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onDismiss, 200);
  };

  // Styles configuration per type
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      border: "border-emerald-200/80",
      progressBg: "bg-emerald-500",
      defaultTitle: "Thành công",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50",
      border: "border-rose-200/80",
      progressBg: "bg-rose-500",
      defaultTitle: "Đã có lỗi xảy ra",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      border: "border-amber-200/80",
      progressBg: "bg-amber-500",
      defaultTitle: "Cảnh báo",
    },
    info: {
      icon: Info,
      iconColor: "text-sky-600",
      iconBg: "bg-sky-50",
      border: "border-sky-200/80",
      progressBg: "bg-sky-500",
      defaultTitle: "Thông tin",
    },
  }[item.type];

  const Icon = typeConfig.icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border ${
        typeConfig.border
      } p-3.5 sm:p-4 shadow-xl shadow-slate-900/10 transition-all duration-200 ${
        isClosing ? "opacity-0 scale-95 translate-x-4" : "animate-in slide-in-from-right-8 fade-in"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${typeConfig.iconBg} ${typeConfig.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 pt-0.5 min-w-0 pr-2">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            {item.title || typeConfig.defaultTitle}
          </h4>
          <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed break-words">
            {item.message}
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition shrink-0 cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Animated subtle duration bar */}
      {item.duration && item.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
          <div
            className={`h-full ${typeConfig.progressBg}`}
            style={{
              animation: `shrinkWidth ${item.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
