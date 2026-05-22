import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, X, Trash2, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Toast ─────────────────────────────────────────────────────────────────────

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

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const TOAST_STYLES = {
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
  const style = TOAST_STYLES[toast.type];
  const Icon = TOAST_ICONS[toast.type];
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
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-700">
        <div ref={barRef} className={cn('h-full w-full', style.bar)} />
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmCtx {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmCtx>({ confirm: async () => false });

export function useConfirm() {
  return useContext(ConfirmContext);
}

function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: (value: boolean) => void }) {
  const Icon = state.danger ? Trash2 : ShieldOff;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onClose(false)}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mx-auto',
          state.danger
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-amber-100 dark:bg-amber-900/30',
        )}>
          <Icon className={cn('w-6 h-6', state.danger ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400')} />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{state.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{state.message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onClose(false)}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {state.cancelLabel ?? 'Cancel'}
          </button>
          <button
            onClick={() => onClose(true)}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white transition-colors',
              state.danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-500 hover:bg-amber-600',
            )}
          >
            {state.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Combined Provider ─────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const remove = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => remove(id), DURATION + 300);
  }, [remove]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  function handleConfirmClose(value: boolean) {
    confirmState?.resolve(value);
    setConfirmState(null);
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      <ConfirmContext.Provider value={{ confirm }}>
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
        {confirmState && <ConfirmDialog state={confirmState} onClose={handleConfirmClose} />}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
