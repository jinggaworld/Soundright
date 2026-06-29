interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  children: React.ReactNode;
}

export function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
        variant === "success"
          ? "bg-sr-green/20 text-sr-green"
          : variant === "warning"
            ? "bg-sr-warning/20 text-sr-warning"
            : variant === "error"
              ? "bg-sr-negative/20 text-sr-negative"
              : variant === "info"
                ? "bg-sr-announcement/20 text-sr-announcement"
                : "bg-sr-mid text-sr-text-secondary"
      }`}
    >
      {children}
    </span>
  );
}
