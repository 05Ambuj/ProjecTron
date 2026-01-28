import { useEffect, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastComponentProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastComponent = ({ toast, onClose }: ToastComponentProps) => {
  const handleClose = useCallback(() => {
    onClose(toast.id);
  }, [toast.id, onClose]);

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    
    // Don't auto-close if duration is 0 or negative
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration, handleClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  };

  const Icon = icons[toast.type];
  const styleClass = styles[toast.type];

  return (
    <div
      className={`${styleClass} border rounded-lg p-4 shadow-lg flex items-start gap-3 min-w-[300px] max-w-md transition-all duration-300 ease-in-out`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={handleClose}
        className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
        aria-label={`Close ${toast.type} notification`}
        type="button"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-100 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className="pointer-events-auto transition-all duration-300 ease-in-out"
        >
          <ToastComponent toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
