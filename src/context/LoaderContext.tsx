import React, { createContext, useState, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LoaderContextType = {
  showLoader: () => void;
  hideLoader: () => void;
};

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}

      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="relative flex flex-col items-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-14 h-14 border-4 border-t-transparent border-white rounded-full"
              />

              <p className="mt-4 text-white text-sm font-medium tracking-wide">
                Loading...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LoaderContext.Provider>
  );
};

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }
  return context;
};
