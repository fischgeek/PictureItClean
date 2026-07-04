import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CloseIcon } from "./icons";

interface LightboxState {
  src: string;
  alt?: string;
}

interface LightboxContextValue {
  open: (src: string, alt?: string) => void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LightboxState | null>(null);

  const open = useCallback((src: string, alt?: string) => setState({ src, alt }), []);
  const close = useCallback(() => setState(null), []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <button
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={close}
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
          <img
            src={state.src}
            alt={state.alt ?? ""}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </LightboxContext.Provider>
  );
}

export function useLightbox() {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error("useLightbox must be used within LightboxProvider");
  return ctx;
}
