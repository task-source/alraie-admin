// src/components/Modal.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "primary" | "danger" | "neutral";
  onConfirm?: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

const colorClasses: Record<string, string> = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  neutral: "bg-gray-300 hover:bg-gray-400 text-gray-800",
};

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title = "Modal Title",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "primary",
  onConfirm,
  loading = false,
  children,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 relative"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
            >
              &times;
            </button>

            {/* Header */}
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                {title}
              </h2>
            )}

            {/* Description or Custom Content */}
            {children ? (
              <div className="text-gray-700 dark:text-gray-300 text-sm">
                {children}
              </div>
            ) : (
              description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {description}
                </p>
              )
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition w-auto dark:text-white"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm transition w-auto ${
                  colorClasses[confirmColor]
                } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {loading ? "Please wait..." : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
