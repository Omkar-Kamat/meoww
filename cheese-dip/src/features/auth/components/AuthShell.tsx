import React from "react";

export const AuthShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f0f0" }}>
      {children}
    </div>
  );
};

export const AuthHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <div style={{ marginBottom: "20px", textAlign: "center" }}>
      <h2 style={{ margin: 0, fontSize: "24px" }}>{title}</h2>
      {subtitle && <p style={{ margin: "5px 0 0", color: "#666" }}>{subtitle}</p>}
    </div>
  );
};

export const AuthCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ backgroundColor: "#fff", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
      {children}
    </div>
  );
};

export const FieldRow = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>{label}</label>
      {children}
      {error && <span style={{ color: "red", fontSize: "12px", display: "block", marginTop: "5px" }}>{error}</span>}
    </div>
  );
};
