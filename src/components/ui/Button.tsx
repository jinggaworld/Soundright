import { ButtonHTMLAttributes, forwardRef } from "react";

/**
 * Button component with multiple variants and sizes.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="outline" size="sm">Cancel</Button>
 * <Button variant="ghost" disabled>Disabled</Button>
 * ```
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant: primary (green), secondary (gray), outline (border), ghost (transparent) */
  variant?: "primary" | "secondary" | "outline" | "ghost";
  /** Button size: sm (small), md (medium, default), lg (large) */
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className = "", children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-full font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
          variant === "primary"
            ? "bg-sr-green text-black hover:bg-sr-green/80 hover:scale-105"
            : variant === "secondary"
              ? "bg-sr-mid text-sr-text hover:bg-sr-card"
              : variant === "outline"
                ? "border border-sr-border bg-transparent text-sr-text hover:bg-sr-mid"
                : "bg-transparent text-sr-text hover:bg-sr-mid"
        } ${
          size === "sm"
            ? "px-4 py-2 text-xs"
            : size === "lg"
              ? "px-12 py-4 text-base"
              : "px-8 py-3 text-sm"
        } ${className}`}
        style={{ letterSpacing: "1.4px" }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
