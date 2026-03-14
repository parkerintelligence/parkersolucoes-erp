import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, ShieldAlert, Info } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default" | "warning";
  icon?: "trash" | "alert" | "shield" | "info";
}

interface ConfirmDialogContextType {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

const iconMap = {
  trash: Trash2,
  alert: AlertTriangle,
  shield: ShieldAlert,
  info: Info,
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setOptions({
        title: opts.title || "Confirmar exclusão",
        description: opts.description || "Tem certeza que deseja excluir? Esta ação não pode ser desfeita.",
        confirmText: opts.confirmText || "Excluir",
        cancelText: opts.cancelText || "Cancelar",
        variant: opts.variant || "destructive",
        icon: opts.icon || (opts.variant === "destructive" || !opts.variant ? "trash" : "alert"),
      });
      setResolveRef(() => resolve);
      setOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolveRef?.(true);
  };

  const handleCancel = () => {
    setOpen(false);
    resolveRef?.(false);
  };

  const isDestructive = options.variant === "destructive";
  const isWarning = options.variant === "warning";
  const IconComponent = iconMap[options.icon || "trash"] || Trash2;

  const accentColor = isDestructive
    ? "text-destructive"
    : isWarning
    ? "text-yellow-500"
    : "text-primary";

  const accentBg = isDestructive
    ? "bg-destructive/10 ring-destructive/20"
    : isWarning
    ? "bg-yellow-500/10 ring-yellow-500/20"
    : "bg-primary/10 ring-primary/20";

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
        <AlertDialogContent className="border-border bg-card sm:max-w-[420px] p-0 overflow-hidden gap-0">
          {/* Accent top bar */}
          <div className={`h-1 w-full ${isDestructive ? 'bg-destructive' : isWarning ? 'bg-yellow-500' : 'bg-primary'}`} />

          <div className="p-6 pb-4">
            <AlertDialogHeader className="gap-0">
              <div className="flex flex-col items-center text-center gap-3">
                {/* Icon circle with ring */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ring-4 ${accentBg} transition-transform`}>
                  <IconComponent className={`h-6 w-6 ${accentColor}`} />
                </div>
                <AlertDialogTitle className="text-foreground text-base font-semibold">
                  {options.title}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed max-w-[320px]">
                  {options.description}
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>
          </div>

          <AlertDialogFooter className="px-6 pb-5 pt-0 flex-row gap-2 sm:justify-center">
            <AlertDialogCancel
              onClick={handleCancel}
              className="flex-1 bg-muted/50 text-foreground hover:bg-muted border-border font-medium text-sm h-9"
            >
              {options.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={`flex-1 font-medium text-sm h-9 shadow-lg ${
                isDestructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/25"
                  : isWarning
                  ? "bg-yellow-500 text-white hover:bg-yellow-600 shadow-yellow-500/25"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
              }`}
            >
              {options.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return context;
}
