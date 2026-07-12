import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type Toast } from '../../store/toastStore';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-success shrink-0" />,
  error: <XCircle className="w-5 h-5 text-danger shrink-0" />,
  info: <Info className="w-5 h-5 text-info shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
};

const styles = {
  success: 'border-success-border bg-success-bg',
  error: 'border-danger-border bg-danger-bg',
  info: 'border-info-border bg-info-bg',
  warning: 'border-warning-border bg-warning-bg',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-modal backdrop-blur-sm ${styles[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-secondary mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-muted hover:text-primary transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="toast-container pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
