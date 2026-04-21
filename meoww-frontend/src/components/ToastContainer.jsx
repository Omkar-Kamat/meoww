import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "../store/useToastStore";
import { toastMotion, TOAST_STYLES } from "../ui.config";

const TOAST_DURATION = 3500;

const S = {
  container:
    "fixed bottom-5 right-5 flex flex-col gap-2.5 z-[99999] pointer-events-none",
  toast:
    "px-[18px] py-2.5 rounded-xl backdrop-blur-xl text-[0.82rem] font-medium min-w-[220px] max-w-[320px] leading-relaxed pointer-events-auto",
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();
  const scheduledIds = useRef(new Set());

  useEffect(() => {
    toasts.forEach((t) => {
      if (scheduledIds.current.has(t.id)) return;
      scheduledIds.current.add(t.id);
      setTimeout(() => {
        remove(t.id);
        scheduledIds.current.delete(t.id);
      }, TOAST_DURATION);
    });
  }, [toasts, remove]);

  return (
    <div className={S.container}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            {...toastMotion}
            className={S.toast}
            style={{
              ...(TOAST_STYLES[toast.type] ?? TOAST_STYLES.info),
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
