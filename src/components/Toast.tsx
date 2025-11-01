import React from "react";
import { motion } from "framer-motion";

interface ToastProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const Toast: React.FC<ToastProps> = ({ type, message }) => {
  const variants = {
    success: {
      border: "border-success-500",
      bg: "bg-success-50 dark:bg-success-500/15",
      icon: "text-success-500",
    },
    error: {
      border: "border-error-500",
      bg: "bg-error-50 dark:bg-error-500/15",
      icon: "text-error-500",
    },
    warning: {
      border: "border-warning-500",
      bg: "bg-warning-50 dark:bg-warning-500/15",
      icon: "text-warning-500",
    },
    info: {
      border: "border-blue-light-500",
      bg: "bg-blue-light-50 dark:bg-blue-light-500/15",
      icon: "text-blue-light-500",
    },
  };

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12.75l-2.25-2.25L5.25 12l3.75 3.75L18.75 6l-1.5-1.5L9 12.75z" />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 10.586L16.95 5.636l1.414 1.414L13.414 12l4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414L10.586 12 5.636 7.05l1.414-1.414L12 10.586z" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 17h2v-6h-2v6zm0-8h2V7h-2v2zm1-7C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      </svg>
    ),
  };

  const { border, bg, icon } = variants[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${border} ${bg} shadow-md backdrop-blur-sm min-w-[280px] max-w-[350px]`}
    >
      <div className={`${icon}`}>{icons[type]}</div>
      <p className="text-sm text-gray-700 dark:text-gray-200">{message}</p>
    </motion.div>
  );
};

export default Toast;
