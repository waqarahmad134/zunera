import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertTriangle, Info, TriangleAlert } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Red confirm button + warning styling, for destructive actions. */
  danger?: boolean;
}

export interface AlertOptions {
  title: string;
  message?: string;
  /** Red icon/heading, for error messages. Defaults to true. */
  danger?: boolean;
}

interface DialogContextValue {
  /** Promise-based replacement for window.confirm — resolves true/false. */
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
  /** Promise-based replacement for window.alert. */
  alertDialog: (opts: AlertOptions | string) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

type PendingConfirm = ConfirmOptions & { resolve: (v: boolean) => void };
type PendingAlert = AlertOptions & { resolve: () => void };

function Overlay({ onDismiss, children }: { onDismiss: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[2000] grid place-items-center bg-ink/40 p-4"
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(11,11,11,0.25)]"
      >
        {children}
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<PendingConfirm | null>(null);
  const [alertState, setAlertState] = useState<PendingAlert | null>(null);

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const normalized = typeof opts === "string" ? { title: opts } : opts;
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...normalized, resolve });
    });
  }, []);

  const alertDialog = useCallback((opts: AlertOptions | string) => {
    const normalized = typeof opts === "string" ? { title: opts } : opts;
    return new Promise<void>((resolve) => {
      setAlertState({ ...normalized, resolve });
    });
  }, []);

  function resolveConfirm(result: boolean) {
    confirmState?.resolve(result);
    setConfirmState(null);
  }

  function resolveAlert() {
    alertState?.resolve();
    setAlertState(null);
  }

  return (
    <DialogContext.Provider value={{ confirm, alertDialog }}>
      {children}

      {confirmState && (
        <Overlay onDismiss={() => resolveConfirm(false)}>
          <span
            className={`grid size-11 place-items-center rounded-full ${
              confirmState.danger ? "bg-red-50 text-red-600" : "bg-accent-soft text-accent"
            }`}
          >
            <AlertTriangle size={20} />
          </span>
          <h2 className="mt-4 text-base font-semibold">{confirmState.title}</h2>
          {confirmState.message && <p className="mt-1.5 text-sm text-ink-soft">{confirmState.message}</p>}
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={() => resolveConfirm(false)}
              className="rounded-xl border border-line px-4 py-2 text-sm text-ink-soft hover:border-ink-soft transition-colors"
            >
              {confirmState.cancelText ?? "Cancel"}
            </button>
            <button
              autoFocus
              onClick={() => resolveConfirm(true)}
              className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors ${
                confirmState.danger ? "bg-red-600 hover:bg-red-700" : "bg-accent hover:bg-accent-deep"
              }`}
            >
              {confirmState.confirmText ?? "Confirm"}
            </button>
          </div>
        </Overlay>
      )}

      {alertState && (
        <Overlay onDismiss={resolveAlert}>
          <span
            className={`grid size-11 place-items-center rounded-full ${
              alertState.danger === false ? "bg-accent-soft text-accent" : "bg-red-50 text-red-600"
            }`}
          >
            {alertState.danger === false ? <Info size={20} /> : <TriangleAlert size={20} />}
          </span>
          <h2 className="mt-4 text-base font-semibold">{alertState.title}</h2>
          {alertState.message && <p className="mt-1.5 text-sm text-ink-soft">{alertState.message}</p>}
          <div className="mt-5 flex justify-end">
            <button
              autoFocus
              onClick={resolveAlert}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-deep transition-colors"
            >
              OK
            </button>
          </div>
        </Overlay>
      )}
    </DialogContext.Provider>
  );
}

export function useDialogs(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialogs must be used within ConfirmProvider");
  return ctx;
}
