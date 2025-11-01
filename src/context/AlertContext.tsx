
import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";
import { AnimatePresence } from "framer-motion";
type AlertType = "success" | "error" | "warning" | "info";

interface Alert {
  id: number;
  type: AlertType;
  message: string;
}

interface AlertContextType {
  showAlert: (type: AlertType, message: string) => void;
  showApiError: (error: any) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context)
    throw new Error("useAlert must be used within an AlertProvider");
  return context;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const removeAlert = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const showAlert = useCallback(
    (type: AlertType, message: string) => {
      const id = Date.now();
      setAlerts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => removeAlert(id), 4000); 
    },
    [removeAlert]
  );


  const showApiError = useCallback(
    (error: any) => {
      let message = "Something went wrong";
      if (error?.response?.data?.error?.message) {
        message = error?.response?.data?.error?.message;
      } else if (error?.message && typeof error.message === "string") {
        message = error.message;
      }
      showAlert("error", message);
    },
    [showAlert]
  );

  return (
    <AlertContext.Provider value={{ showAlert, showApiError }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 items-end">
        <AnimatePresence>
          {alerts.map((a) => (
            <Toast key={a.id} type={a.type} message={a.message} />
          ))}
        </AnimatePresence>
      </div>
    </AlertContext.Provider>
  );
};
