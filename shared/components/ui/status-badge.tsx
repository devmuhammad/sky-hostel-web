import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "payment" | "custom";
  colorMap?: Record<string, string>;
  className?: string;
}

export function StatusBadge({
  status,
  variant = "default",
  colorMap,
  className,
}: StatusBadgeProps) {
  const getStatusVariant = () => {
    // If custom color map provided, use custom styling
    if (colorMap && colorMap[status]) {
      return "outline";
    }

    switch (variant) {
      case "payment":
        const paymentVariants = {
          completed: "default", // Green-ish
          pending: "secondary", // Yellow-ish
          failed: "destructive", // Red
        };
        return (
          paymentVariants[status as keyof typeof paymentVariants] || "outline"
        );

      case "custom":
        return "outline";

      default:
        const defaultVariants = {
          active: "default",
          inactive: "secondary",
          pending: "secondary",
          completed: "default",
          cancelled: "destructive",
        };
        return (
          defaultVariants[status as keyof typeof defaultVariants] || "outline"
        );
    }
  };

  const getCustomClasses = () => {
    if (!colorMap || !colorMap[status]) return "";

    // Handle custom color map
    const colorClass = colorMap[status];
    return colorClass;
  };

  const badgeVariant = getStatusVariant() as
    | "default"
    | "secondary"
    | "destructive"
    | "outline";
  const customClasses = getCustomClasses();

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        customClasses,
        // Payment-specific colors when using payment variant
        variant === "payment" && {
          "bg-green-100 text-green-800 border-green-200":
            status === "completed",
          "bg-yellow-100 text-yellow-800 border-yellow-200":
            status === "pending",
          "bg-orange-100 text-orange-800 border-orange-200":
            status === "partially_paid",
          "bg-red-100 text-red-800 border-red-200": status === "failed",
        },
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
