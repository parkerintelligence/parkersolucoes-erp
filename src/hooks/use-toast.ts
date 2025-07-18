import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export function toast({ title, description, variant = 'default' }: ToastProps) {
  if (variant === 'destructive') {
    sonnerToast.error(title, { description });
  } else if (variant === 'success') {
    sonnerToast.success(title, { description });
  } else {
    sonnerToast.info(title, { description });
  }
}

export { toast as useToast };