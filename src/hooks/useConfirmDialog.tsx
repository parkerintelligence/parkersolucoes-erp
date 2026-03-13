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
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
}

interface ConfirmDialogContextType {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

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

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
        <AlertDialogContent className="border-border bg-card sm:max-w-[440px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                options.variant === "destructive" 
                  ? "bg-destructive/10" 
                  : "bg-primary/10"
              }`}>
                <AlertTriangle className={`h-5 w-5 ${
                  options.variant === "destructive" 
                    ? "text-destructive" 
                    : "text-primary"
                }`} />
              </div>
              <div>
                <AlertDialogTitle className="text-foreground text-base">
                  {options.title}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm mt-1">
                  {options.description}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel 
              onClick={handleCancel}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
            >
              {options.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                options.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm shadow-destructive/20"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }
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
