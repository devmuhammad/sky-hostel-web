import { useMemo } from "react";
import { toast } from "sonner";

interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export function useToast() {
  return useMemo(
    () => ({
      success: (message: string, options?: ToastOptions) => {
        return toast.success(message, {
          description: options?.description,
          duration: options?.duration,
          action: options?.action
            ? {
                label: options.action.label,
                onClick: options.action.onClick,
              }
            : undefined,
        });
      },

      error: (message: string, options?: ToastOptions) => {
        return toast.error(message, {
          description: options?.description,
          duration: options?.duration || 6000, // Longer duration for errors
          action: options?.action
            ? {
                label: options.action.label,
                onClick: options.action.onClick,
              }
            : undefined,
        });
      },

      warning: (message: string, options?: ToastOptions) => {
        return toast.warning(message, {
          description: options?.description,
          duration: options?.duration,
          action: options?.action
            ? {
                label: options.action.label,
                onClick: options.action.onClick,
              }
            : undefined,
        });
      },

      info: (message: string, options?: ToastOptions) => {
        return toast.info(message, {
          description: options?.description,
          duration: options?.duration,
          action: options?.action
            ? {
                label: options.action.label,
                onClick: options.action.onClick,
              }
            : undefined,
        });
      },

      loading: (message: string, options?: ToastOptions) => {
        return toast.loading(message, {
          description: options?.description,
        });
      },

      dismiss: (toastId?: string | number) => {
        toast.dismiss(toastId);
      },

      promise: <T>(
        promise: Promise<T>,
        msgs: {
          loading: string;
          success: string;
          error: string;
        }
      ) => {
        return toast.promise(promise, msgs);
      },
    }),
    []
  );
}
