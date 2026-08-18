import type { ReactNode } from "react";

export const FieldRow = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>{label}</label>
      {children}
      {error && <span style={{ color: "red", fontSize: "12px", display: "block", marginTop: "5px" }}>{error}</span>}
    </div>
  );
};
