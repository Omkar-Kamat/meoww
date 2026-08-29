import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    ({ style, ...props }, ref) => {
        return (
            <input
                ref={ref}
                {...props}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box", ...style }}
            />
        );
    },
);
Input.displayName = "Input";
