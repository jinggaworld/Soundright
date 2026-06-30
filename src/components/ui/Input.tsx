import { InputHTMLAttributes, forwardRef } from "react";

/**
 * Input component with label and error state support.
 *
 * @example
 * ```tsx
 * <Input label="Email" placeholder="you@example.com" />
 * <Input label="Password" type="password" error="Password is required" />
 * ```
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional label displayed above the input */
  label?: string;
  /** Error message displayed below the input when present */
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1 block text-sm font-bold text-sr-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-full bg-sr-mid px-4 py-3 text-sr-text placeholder:text-sr-text-secondary focus:outline-none ${
            error
              ? "shadow-[rgb(18,18,18)_0px_1px_0px,rgb(243,114,127)_0px_0px_0px_1px_inset]"
              : "shadow-[rgb(18,18,18)_0px_1px_0px,rgb(124,124,124)_0px_0px_0px_1px_inset] focus:shadow-[rgb(18,18,18)_0px_1px_0px,rgb(0,0,0)_0px_0px_0px_1px_inset]"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-sr-negative">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
