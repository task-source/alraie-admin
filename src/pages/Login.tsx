import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import ThemeToggle from "../components/ThemeToggle";
import logo from "../images/logo192.png";

const Login = () => {
  const { showAlert, showApiError } = useAlert();
  const { showLoader, hideLoader } = useLoader();
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      showLoader();
      const res = await api.post("/auth/login", {
        accountType: "email",
        email,
        password,
        language: "en",
      });

      if (res.data.success) {
        setToken(res.data.refreshToken);
        showAlert("success", "Logged in successfully");
        navigate("/");
      } else {
        setError("Invalid credentials");
      }
    } catch (err: any) {
      showApiError(err);
      setError("Login failed. Please try again.");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-center w-full lg:w-1/2 px-6 sm:px-8 py-10">
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center gap-3 mb-6 lg:hidden">
            <img src={logo} alt="Logo" className="w-10 h-10" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Alraie Admin
            </h1>
          </div>

          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Sign In
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Welcome back! Please enter your credentials.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#6366F1] focus:outline-none px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#6366F1] focus:outline-none px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium rounded-lg py-2.5 transition-colors duration-200 focus:ring-4 focus:ring-blue-300 focus:outline-none"
            >
              Sign In
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            © {new Date().getFullYear()} Alraie Admin. All rights reserved.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center w-1/2 bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-400 relative overflow-hidden">

        <motion.div
          className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#ffffff_1px,_transparent_1px)] [background-size:22px_22px]"
          animate={{
            backgroundPosition: ["0px 0px", "80px 80px"],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 18,
            ease: "linear",
            repeat: Infinity,
          }}
        />

        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-3xl bg-white/20"
          animate={{
            x: [0, 50, 0, -50, 0],
            y: [0, -30, 0, 30, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative z-10 text-center">
          <div className="flex flex-col items-center gap-6">
            <img src={logo} alt="Logo" className="w-20 h-20 drop-shadow-lg" />
            <h1 className="text-4xl font-semibold text-white">Alraie Admin</h1>
            <p className="text-white/80 text-sm max-w-md leading-relaxed">
              Manage, monitor, and maintain Alraie effortlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
