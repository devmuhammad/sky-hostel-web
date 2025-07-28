import { ReactNode } from "react";

interface AdminLoginLayoutProps {
  children: ReactNode;
}

export default function AdminLoginLayout({ children }: AdminLoginLayoutProps) {
  return <>{children}</>;
}
