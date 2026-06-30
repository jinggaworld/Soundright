import { HTMLAttributes, forwardRef } from "react";

/**
 * Card container component with optional hover effect.
 *
 * @example
 * ```tsx
 * <Card hover={false}>Static content</Card>
 * <Card className="p-8">Custom padding</Card>
 * ```
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Enable hover shadow effect (default: true) */
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = true, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg bg-sr-surface p-4 ${
          hover
            ? "transition-shadow hover:shadow-[rgba(0,0,0,0.3)_0px_8px_8px]"
            : ""
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
