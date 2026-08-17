import { useToastStore } from "../store/useToastStore";

export const ToastContainer = () => {
  const { toasts, remove } = useToastStore();

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 9999 }}>
      {toasts.map((toast) => {
        let bgColor = "#17a2b8";
        if (toast.type === "success") bgColor = "#28a745";
        if (toast.type === "error") bgColor = "#dc3545";
        if (toast.type === "warning") bgColor = "#ffc107";

        return (
          <div 
            key={toast.id} 
            onClick={() => remove(toast.id)}
            style={{ padding: "10px 20px", backgroundColor: bgColor, color: "white", borderRadius: "4px", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
          >
            {toast.message}
          </div>
        );
      })}
    </div>
  );
};
