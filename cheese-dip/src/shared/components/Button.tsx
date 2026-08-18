import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ style, fullWidth, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        {...props}
        style={{
          width: fullWidth ? "100%" : undefined,
          padding: "10px",
          backgroundColor: disabled ? "#ccc" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: disabled ? "not-allowed" : "pointer",
          marginTop: "10px",
          ...style
        }}
      />
    );
  }
);
Button.displayName = "Button";
