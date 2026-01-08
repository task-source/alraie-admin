import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

const AddAdmin: React.FC = () => {
    const { showLoader, hideLoader } = useLoader();
    const { showAlert, showApiError } = useAlert();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [otp, setOtp] = useState("");
    const [otpStep, setOtpStep] = useState(false);
    const [adminCreated, setAdminCreated] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const OTP_DURATION = 60;

    const [otpTimer, setOtpTimer] = useState(OTP_DURATION);
    const [canResend, setCanResend] = useState(false);
    /* ---------------- Prevent Back Navigation after OTP ---------------- */
    useEffect(() => {
        if (!otpStep) return;

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [otpStep]);

    useEffect(() => {
        if (otpTimer <= 0) {
            setCanResend(true);
            return;
        }

        const interval = setInterval(() => {
            setOtpTimer((t) => t - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [otpTimer]);
    /* ---------------- CREATE ADMIN ---------------- */
    const startOtpTimer = () => {
        setOtpTimer(OTP_DURATION);
        setCanResend(false);
    };

    const handleCreateAdmin = async () => {
        if (!email || !password) {
            showAlert("error", "Email and password are required");
            return;
        }

        try {
            showLoader();
            const res = await api.post("/auth/addAdmin", {
                email,
                password,
            });

            if (res?.data?.success) {
                setOtpStep(true);
                setAdminCreated(true);
                showAlert(
                    "success",
                    "Admin created. OTP sent to email. Please verify."
                );
                startOtpTimer();
            }
        } catch (err) {
            showApiError(err);
        } finally {
            hideLoader();
        }
    };

    /* ---------------- RESEND OTP ---------------- */
    const handleResendOtp = async () => {
        try {
            showLoader();
            const res = await api.post("/auth/resendAdminOtp", { email });
            if (res?.data?.success) {
                showAlert("success", "OTP resent successfully");
                startOtpTimer();
            }
        } catch (err) {
            showApiError(err);
        } finally {
            hideLoader();
        }
    };

    /* ---------------- VERIFY OTP ---------------- */
    const handleVerifyOtp = async () => {
        if (!otp.trim()) {
            showAlert("error", "Please enter OTP");
            return;
        }

        try {
            showLoader();
            const res = await api.post("/auth/verifyAdminOtp", {
                email,
                otp,
            });

            if (res?.data?.success) {
                showAlert("success", "Admin verified successfully");
                navigate("/users");
            }
        } catch (err) {
            showApiError(err);
        } finally {
            hideLoader();
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
                <Header />

                <PageWrapper>
                    <div className="px-3 sm:px-6 max-w-3xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                                Add Admin
                            </h1>

                            {!otpStep && (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-sm dark:text-white"
                                >
                                    Back
                                </button>
                            )}
                        </div>

                        {/* Card */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5">
                            {/* Email */}
                            <div>
                                <label className="text-sm text-gray-700 dark:text-gray-300">
                                    Email *
                                </label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={otpStep}
                                    className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white disabled:opacity-60"
                                />
                            </div>

                            {/* Password */}
                            {!otpStep && (
                                <div className="relative">
                                    <label className="text-sm text-gray-700 dark:text-gray-300">
                                        Password *
                                    </label>

                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 pr-10 text-sm dark:text-white"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute right-3 top-9 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            )}

                            {/* OTP SECTION */}
                            {otpStep && (
                                <div className="space-y-4 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 bg-indigo-50 dark:bg-indigo-900/20">
                                    <div className="text-sm text-indigo-700 dark:text-indigo-300">
                                        ⚠️ Please do <strong>NOT</strong> press back or refresh.
                                        Admin will remain unverified otherwise.
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-700 dark:text-gray-300">
                                            OTP *
                                        </label>
                                        <input
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={handleVerifyOtp}
                                            className="flex-1 bg-[#4F46E5] hover:bg-[#0000CC] text-white py-2 rounded-lg text-sm font-medium transition"
                                        >
                                            Verify OTP
                                        </button>
                                        <div className="flex flex-1 items-center justify-center text-sm">
                                            {!canResend ? (
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    Resend OTP in {otpTimer}s
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={handleResendOtp}
                                                    className="flex-1 border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white py-2 rounded-lg text-sm font-medium transition"
                                                >
                                                    Resend OTP
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SUBMIT */}
                            {!otpStep && (
                                <button
                                    onClick={handleCreateAdmin}
                                    className="w-full bg-[#4F46E5] hover:bg-[#0000CC] text-white py-2 rounded-lg text-sm font-medium transition"
                                >
                                    Create Admin
                                </button>
                            )}
                        </div>
                    </div>
                </PageWrapper>
            </main>
        </div>
    );
};

export default AddAdmin;
