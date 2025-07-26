import { Button } from "./button";
import { ReactNode } from "react";

interface LoadingButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export function LoadingButton({
  isLoading,
  loadingText = "Loading...",
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading || disabled} {...props}>
      {isLoading ? loadingText : children}
    </Button>
  );
}
