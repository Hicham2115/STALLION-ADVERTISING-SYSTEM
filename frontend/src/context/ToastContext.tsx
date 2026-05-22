import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const STYLES = {
  success: {
    container: 'bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-500',
    bar: 'bg-emerald-500',
  },
  error: {
    container: 'bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800',
    icon: 'text-red-500',
    bar: 'bg-red-500',
  },
  warning: {
    container: 'bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500',
    bar: 'bg-amber-500',
  },
};

const DURATION = 4000;

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const style = STYLES[toast.type];
  const Icon = ICONS[toast.type];
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.transition = `width ${DURATION}ms linear`;
    requestAnimationFrame(() => { bar.style.width = '0%'; });
  }, []);

  return (
    <div className={cn(
      'relative flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg w-80 overflow-hidden',
      'animate-in slide-in-from-right-4 duration-300',
      style.container,
    )}>
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', style.icon)} />
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 flex-1 pr-2 leading-snug">
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-700">
        <div ref={barRef} className={cn('h-full w-full', style.bar)} />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => remove(id), DURATION + 300);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onRemove={remove} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
