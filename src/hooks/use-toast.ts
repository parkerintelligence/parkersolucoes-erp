// Compatibility layer for old toast API using Sonner
import { toast as sonnerToast } from 'sonner';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

function toastFunction(props: ToastProps): void {
  const { title, description, variant = 'default', duration } = props;
  
  if (variant === 'destructive') {
    sonnerToast.error(title, { description, duration });
  } else if (variant === 'success') {
    sonnerToast.success(title, { description, duration });
  } else {
    sonnerToast.info(title, { description, duration });
  }
}

// Add methods to the function for direct Sonner-style calls
toastFunction.error = (title: string, options?: { description?: string; duration?: number }) => {
  sonnerToast.error(title, options);
};

toastFunction.success = (title: string, options?: { description?: string; duration?: number }) => {
  sonnerToast.success(title, options);
};

toastFunction.info = (title: string, options?: { description?: string; duration?: number }) => {
  sonnerToast.info(title, options);
};

toastFunction.warning = (title: string, options?: { description?: string; duration?: number }) => {
  sonnerToast.warning(title, options);
};

export const toast = toastFunction;

// For components that still use useToast hook - simple compatibility
export function useToast() {
  return { toast };
}