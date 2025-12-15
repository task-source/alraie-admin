import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { FiMenu, FiChevronDown, FiChevronRight } from "react-icons/fi";
import {
  FaHome,
  FaUsers,
  FaFileAlt,
  FaUserShield,
  FaPaw,
  FaDog,
  FaSignOutAlt,
  FaStreetView,
  FaImages,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaCartPlus,
  FaMoneyBill
} from "react-icons/fa";
import logo from "../images/logo192.png";

const menuItems = [
  { text: "Dashboard", path: "/", icon: <FaHome /> },
  { text: "Users", path: "/users", icon: <FaUsers /> },
  { text: "Animals", path: "/animals", icon: <FaPaw /> },
  { text: "Animal Type", path: "/animalType", icon: <FaPaw /> },
  { text: "Breeds", path: "/breeds", icon: <FaDog /> },
  { text: "Geofences", path: "/geofences", icon: <FaStreetView /> },
  { text: "GPS", path: "/gps", icon: <FaMapMarkerAlt /> },
  {
    text: "Marketplace",
    icon: <FaShoppingBag />,
    children: [
      { text: "Products", path: "/products", icon: <FaCartPlus /> },
      { text: "Orders", path: "/orders", icon: <FaMoneyBill /> },
    ],
  },
  { text: "Slides", path: "/slides", icon: <FaImages /> },
  { text: "Terms & Conditions", path: "/terms", icon: <FaFileAlt /> },
  { text: "Privacy Policy", path: "/privacy", icon: <FaUserShield /> },
];

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [marketOpen, setMarketOpen] = React.useState<boolean>(false);
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    isMobile,
    toggleMobileSidebar,
    setIsHovered,
    toggleSidebar,
    closeMobileSidebar,
  } = useSidebar();

  const expanded = isExpanded || isMobileOpen || isHovered;

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (!isMobile && !isExpanded) toggleSidebar();

    if (isMobile && isMobileOpen) closeMobileSidebar();
  };

  React.useEffect(() => {
    if (location.pathname.startsWith("/products") || location.pathname.startsWith("/orders")) {
      setMarketOpen(true);
    }
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-black/40 z-40"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: expanded ? 290 : 70,
          x: isMobile ? (isMobileOpen ? 0 : 0) : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 flex flex-col justify-between`}
        onMouseEnter={() => !isMobile && !isExpanded && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >

        <div
          className={`py-6 px-4 flex items-center ${expanded ? "justify-start" : "justify-center"
            }`}
        >
          {expanded ? (
            <Link to="/" className="flex items-center gap-2 ml-2">
              <img src={logo} alt="logo" className="w-8 h-8" />
              <span className="font-semibold text-lg text-gray-900 dark:text-white">
                Alraie Admin
              </span>
            </Link>
          ) : (
            <Link to="/">
              <img src={logo} alt="Logo icon" className="h-8" />
            </Link>
          )}
        </div>


        <nav className="px-2 overflow-y-auto flex-1">
          <ul className="flex flex-col gap-1">
            {isMobile && (
              <li key="mobileToggle">
                <button
                  onClick={toggleMobileSidebar}
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-3 transition-colors duration-200 lg:hidden
                    text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                    ${!expanded ? "justify-center" : "justify-start"}
                  `}
                >
                  <span className="text-lg">
                    <FiMenu size={20} />
                  </span>
                  <span
                    className={`text-sm font-medium truncate transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                      }`}
                  >
                    {isMobileOpen ? "Collapse" : "Expand"}
                  </span>
                </button>
              </li>
            )}

            {menuItems.map((item) => {
              // ----------------------------------
              // MARKETPLACE (WITH SUBMENU)
              // ----------------------------------
              if ("children" in item) {
                const isActive = item?.children?.some(
                  (c) => location.pathname === c.path
                );

                return (
                  <li key={item.text}>
                    {/* Parent */}
                    <button
                      onClick={() => setMarketOpen((v) => !v)}
                      className={`w-full flex items-center gap-3 rounded-md px-3 py-3 transition-colors
            ${isActive
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }
            ${!expanded ? "justify-center" : "justify-start"}
          `}
                    >
                      <span className="text-lg">{item.icon}</span>

                      <span
                        className={`text-sm font-medium transition-opacity ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                          }`}
                      >
                        {item.text}
                      </span>

                      {expanded && (
                        <span className="ml-auto text-xs">
                          {marketOpen ? (
                            <FiChevronDown size={16} />
                          ) : (
                            <FiChevronRight size={16} />
                          )}
                        </span>
                      )}
                    </button>

                    {/* Sub menu */}
                    {marketOpen && expanded && (
                      <ul className="ml-9 mt-1 flex flex-col gap-1">
                        {item?.children?.map((child) => {
                          const active = location.pathname === child.path;

                          return (
                            <li key={child.text}>
                              <button
                                onClick={() => handleMenuClick(child.path)}
                                className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                      ${active
                                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  }
                    `}
                              >
                                <span className="text-sm">{child.icon}</span>
                                {child.text}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // ----------------------------------
              // NORMAL SINGLE ITEM
              // ----------------------------------
              const active = location.pathname === item.path;

              return (
                <li key={item.text}>
                  <button
                    onClick={() => handleMenuClick(item.path)}
                    className={`w-full flex items-center gap-3 rounded-md px-3 py-3 transition-colors
          ${active
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }
          ${!expanded ? "justify-center" : "justify-start"}
        `}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span
                      className={`text-sm font-medium transition-opacity ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                        }`}
                    >
                      {item.text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4">
          <div
            className={`flex items-center gap-3 rounded-md px-2 py-2 ${!expanded ? "justify-center" : ""
              }`}
          >
            <button
              onClick={() => {
                logout();
                navigate("/login");
                if (isMobile && isMobileOpen) closeMobileSidebar();
              }}
              className="w-full flex items-center gap-3 text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <span className="text-lg">
                <FaSignOutAlt />
              </span>
              <span
                className={`text-sm font-medium transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                  }`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </motion.aside>

      <div
        className={`transition-all duration-300 ${expanded ? "ml-[290px]" : "ml-[70px]"
          } ${isMobile ? "ml-[290px]" : ""}`}
      />
    </>
  );
};

export default Sidebar;
