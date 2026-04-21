import { create } from "zustand";

let id = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  show: (message, type = "info") =>
    set((state) => ({
      toasts: [
        ...state.toasts.slice(-4),
        { id: ++id, message, type },
      ],
    })),
  remove: (toastId) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== toastId),
    })),
}));