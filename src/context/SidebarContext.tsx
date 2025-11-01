import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";

type SidebarContextType = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  isMobile: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
  setIsHovered: Dispatch<SetStateAction<boolean>>;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobileNow = window.innerWidth < 1024;
      setIsMobile(mobileNow);

      if (mobileNow) {
        setIsExpanded(false);
      } else {
        setIsMobileOpen(false);
        setIsExpanded(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsExpanded((prev) => !prev);
    }
  };

  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);
  const closeMobileSidebar = () => setIsMobileOpen(false);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobileOpen,
        isHovered,
        isMobile,
        setIsExpanded,
        setIsHovered,
        toggleSidebar,
        toggleMobileSidebar,
        closeMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
