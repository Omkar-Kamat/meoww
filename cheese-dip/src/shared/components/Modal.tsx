import type { ReactNode } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "8px",
                    minWidth: "300px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "15px",
                    }}
                >
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            fontSize: "16px",
                        }}
                    >
                        &times;
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};
