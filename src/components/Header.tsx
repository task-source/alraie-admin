import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bars3Icon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../images/logo192.png";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  const { isExpanded, toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hidden lg:block hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Toggle Sidebar"
        >
          <Bars3Icon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
        </button>

        <Link to="/">
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 ml-1"
            >
              <img src={logo} alt="Alraie" className="w-8 h-8 object-contain" />
              <h1 className="font-semibold text-lg text-gray-900 dark:text-white">
                Alraie Admin
              </h1>
            </motion.div>
          )}
        </Link>
      </div>

      <button
        onClick={toggleTheme}
        className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Toggle Theme"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MoonIcon className="w-5 h-5 text-yellow-400" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SunIcon className="w-6 h-6 text-[#4F46E5]" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </header>
  );
};

export default Header;
