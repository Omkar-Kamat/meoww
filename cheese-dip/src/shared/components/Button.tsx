import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export const Button = ({ variant = "primary", children, style, ...props }: ButtonProps) => {
  let bgColor = "#007bff";
  const color = "white";

  if (variant === "secondary") {
    bgColor = "#6c757d";
  } else if (variant === "danger") {
    bgColor = "#dc3545";
  }

  return (
    <button
      style={{
        padding: "8px 16px",
        backgroundColor: bgColor,
        color,
        border: "none",
        borderRadius: "4px",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};
