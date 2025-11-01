import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { motion } from "framer-motion";
import { FiUsers, FiClipboard, FiShield, FiUserCheck } from "react-icons/fi";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";

type Stats = {
  totalUsers: number;
  totalOwners: number;
  totalAdmins: number;
  totalAssistants: number;
};

const COLOR_MAP: Record<string, string> = {
  Owners: "#6366F1", // Indigo
  Assistants: "#10B981", // Emerald
  Admins: "#F59E0B", // Amber
};

const sampleSparkline = [
  { month: "Jan", value: 120 },
  { month: "Feb", value: 200 },
  { month: "Mar", value: 150 },
  { month: "Apr", value: 240 },
  { month: "May", value: 300 },
  { month: "Jun", value: 260 },
  { month: "Jul", value: 320 },
];

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
}> = ({ title, value, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="flex-1 min-w-[220px] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors duration-300"
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{title}</div>
        <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
          {value}
        </div>
      </div>
      <div className="text-2xl text-gray-400 dark:text-gray-300">{icon}</div>
    </div>
  </motion.div>
);

const Dashboard: React.FC = () => {
  const { showApiError } = useAlert();
  const { showLoader, hideLoader } = useLoader();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOwners: 0,
    totalAdmins: 0,
    totalAssistants: 0,
  });
  const [sparkData] = useState(sampleSparkline);
  const [activeSections, setActiveSections] = useState<string[]>([
    "Owners",
    "Assistants",
    "Admins",
  ]);

  const barData = [
    { label: "Users", value: stats.totalUsers },
    { label: "Owners", value: stats.totalOwners },
    { label: "Assistants", value: stats.totalAssistants },
    { label: "Admins", value: stats.totalAdmins },
  ];

  const pieBaseData = [
    { label: "Owners", value: stats.totalOwners },
    { label: "Assistants", value: stats.totalAssistants },
    { label: "Admins", value: stats.totalAdmins },
  ];

  const pieData = pieBaseData.filter((d) => activeSections.includes(d.label));

  useEffect(() => {
    (async () => {
      showLoader();
      try {
        const res = await api.get("/admin/dashboard/stats");
        if (res.data?.success) {
          const d = res.data.data;
          setStats({
            totalUsers: d.totalUsers ?? 0,
            totalOwners: d.totalOwners ?? 0,
            totalAdmins: d.totalAdmins ?? 0,
            totalAssistants: d.totalAssistants ?? 0,
          });
        }
      } catch (err) {
        showApiError(err);
      } finally {
        hideLoader();
      }
    })();
  }, []);

  const toggleSection = (label: string) => {
    setActiveSections((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <PageWrapper>
          <div className="flex items-center justify-between mb-6 gap-5">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Overview of platform statistics
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<FiUsers />}
            />
            <StatCard
              title="Total Owners"
              value={stats.totalOwners}
              icon={<FiUserCheck />}
            />
            <StatCard
              title="Total Assistants"
              value={stats.totalAssistants}
              icon={<FiClipboard />}
            />
            <StatCard
              title="Total Admins"
              value={stats.totalAdmins}
              icon={<FiShield />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    User growth (sample trend)
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {stats.totalUsers} users
                  </div>
                </div>
              </div>

              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#4F46E5"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#4F46E5"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" hide />
                    <ReTooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      fill="url(#colorUv)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
              <div className="mb-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  User type breakdown
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  Distribution
                </div>
              </div>

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ left: -10, right: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis dataKey="label" tick={{ fill: "#9CA3AF" }} />
                    <YAxis />
                    <ReTooltip />
                    <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
            <div className="mb-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Role distribution
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={4}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.label}
                          fill={COLOR_MAP[entry.label] || "#9CA3AF"}
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {pieBaseData.map((d) => {
                  const active = activeSections.includes(d.label);
                  return (
                    <button
                      key={d.label}
                      onClick={() => toggleSection(d.label)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition ${
                        active
                          ? "border-transparent bg-gray-100 dark:bg-gray-700"
                          : "border border-gray-300 dark:border-gray-600 opacity-60"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLOR_MAP[d.label],
                          opacity: active ? 1 : 0.3,
                        }}
                      ></span>
                      <span
                        className={`text-sm font-medium ${
                          active
                            ? "text-gray-800 dark:text-gray-200"
                            : "text-gray-400 dark:text-gray-500 line-through"
                        }`}
                      >
                        {d.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default Dashboard;