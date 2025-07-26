import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardContainerProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function CardContainer({
  children,
  title,
  className = "",
  headerClassName = "",
  contentClassName = "",
}: CardContainerProps) {
  if (title) {
    return (
      <Card className={className}>
        <CardHeader className={headerClassName}>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className={contentClassName}>{children}</CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className={cn("pt-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
