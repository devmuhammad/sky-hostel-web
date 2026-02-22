import { ReactNode } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
  showCloseButton?: boolean;
  hideDefaultFooter?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  footer,
  showCloseButton = true,
  hideDefaultFooter = false,
}: ModalProps) {
  const sizeClasses = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-4xl",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${sizeClasses[size]} max-h-[90vh] sm:max-h-[85vh] overflow-y-auto flex flex-col p-6`}
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="flex-shrink-0 mb-4">
          <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
          {description && <DialogDescription className="text-gray-500 mt-1">{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>

        {footer && (
          <DialogFooter className="flex-shrink-0 mt-6">{footer}</DialogFooter>
        )}

        {!footer && !hideDefaultFooter && (
          <DialogFooter className="flex-shrink-0 mt-6">
            <Button variant="outline" onClick={onClose} className="rounded-full px-6">
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
