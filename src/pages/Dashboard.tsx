import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiClipboard,
  FiShield,
  FiUserCheck,
  FiActivity,
  FiHome,
  FiHeart,
} from "react-icons/fi";
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

type UserStats = {
  totalUsers: number;
  totalOwners: number;
  totalAdmins: number;
  totalAssistants: number;
};

type AnimalStats = {
  totalAnimals: number;
  farmAnimals: number;
  petAnimals: number;
  types: {
    key: string;
    name_en: string | null;
    name_ar: string | null;
    count: number;
  }[];
};

type DashboardData = {
  users: UserStats;
  animals: AnimalStats;
};

type AnimalStatusSummary = {
  active: number;
  sold: number;
  dead: number;
  transferred: number;
  total: number;
};

const COLOR_PALETTE = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
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

  const [activeFarmSections, setActiveFarmSections] = useState<string[]>([]);
  const [activePetSections, setActivePetSections] = useState<string[]>([]);

  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    totalOwners: 0,
    totalAdmins: 0,
    totalAssistants: 0,
  });

  const [animalStats, setAnimalStats] = useState<AnimalStats>({
    totalAnimals: 0,
    farmAnimals: 0,
    petAnimals: 0,
    types: [],
  });

  const [animalStatusSummary, setAnimalStatusSummary] =
    useState<AnimalStatusSummary | null>(null);

  const [sparkData, setSparkData] = useState<
    { month: string; value: number }[]
  >([]);
  const [growthError, setGrowthError] = useState(false);

  useEffect(() => {
    (async () => {
      showLoader();
      try {
        const res = await api.get("/admin/dashboard/stats");
        if (res.data?.success) {
          const data: DashboardData = res.data.data;
          setUserStats(data?.users);
          setAnimalStats(data?.animals);

          const farmKeys = data?.animals?.types
            ?.filter((a) => a.key.toLowerCase().includes("farm"))
            .map((a) => a.key);
          const petKeys = data?.animals?.types
            ?.filter((a) => !a.key.toLowerCase().includes("farm"))
            .map((a) => a.key);
          setActiveFarmSections(farmKeys || []);
          setActivePetSections(petKeys || []);
        }

        const growthRes = await api.get("/admin/dashboard/userGrowth");
        if (growthRes?.data?.success && Array.isArray(growthRes.data.data)) {
          const formattedData = growthRes.data.data.map(
            (d: { month: string; value: number }) => ({
              month: d.month ?? "",
              value: Number(d.value) || 0,
            })
          );
          setSparkData(formattedData);
        } else {
          setGrowthError(true);
        }

        const animalStatusRes = await api.get(
          "/admin/dashboard/animalStatusSummary"
        );
        if (animalStatusRes?.data?.success && animalStatusRes.data.data) {
          setAnimalStatusSummary(animalStatusRes.data.data);
        } else {
          setAnimalStatusSummary(null);
        }
      } catch (err) {
        showApiError(err);
        setGrowthError(true);
      } finally {
        hideLoader();
      }
    })();
  }, []);

  const barData = animalStatusSummary
    ? [
        { label: "Active", value: animalStatusSummary.active ?? 0 },
        { label: "Sold", value: animalStatusSummary.sold ?? 0 },
        { label: "Dead", value: animalStatusSummary.dead ?? 0 },
        { label: "Transferred", value: animalStatusSummary.transferred ?? 0 },
      ]
    : [];

  const farmAnimalTypes = animalStats?.types?.filter((a) =>
    a.key.toLowerCase().includes("farm")
  );
  const petAnimalTypes = animalStats?.types?.filter(
    (a) => !a.key.toLowerCase().includes("farm")
  );

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
              value={userStats?.totalUsers}
              icon={<FiUsers />}
            />
            <StatCard
              title="Total Owners"
              value={userStats?.totalOwners}
              icon={<FiUserCheck />}
            />
            <StatCard
              title="Total Assistants"
              value={userStats?.totalAssistants}
              icon={<FiClipboard />}
            />
            <StatCard
              title="Total Admins"
              value={userStats?.totalAdmins}
              icon={<FiShield />}
            />
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <StatCard
              title="Total Animals"
              value={animalStats?.totalAnimals}
              icon={<FiActivity />}
            />
            <StatCard
              title="Farm Animals"
              value={animalStats?.farmAnimals}
              icon={<FiHome />}
            />
            <StatCard
              title="Pet Animals"
              value={animalStats?.petAnimals}
              icon={<FiHeart />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
              <div className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                User Growth (last 12 months)
              </div>
              {growthError || sparkData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  No growth data available
                </div>
              ) : (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData}>
                      <defs>
                        <linearGradient
                          id="colorUv"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
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
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                      <ReTooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        fill="url(#colorUv)"
                        dot={{ r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Animal Status Summary
              </div>
              {barData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  No status data available
                </div>
              ) : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e7eb"
                      />
                      <XAxis dataKey="label" tick={{ fill: "#9CA3AF" }} />
                      <YAxis />
                      <ReTooltip />
                      <Bar
                        dataKey="value"
                        fill="#4F46E5"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {farmAnimalTypes?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex flex-col">
                <div className="mb-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Farm Animal Distribution
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {animalStats.farmAnimals} Farm Animals
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
                  <div className="w-full md:w-1/2 h-64 md:h-72 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={farmAnimalTypes?.filter((a) =>
                            activeFarmSections.includes(a.key)
                          )}
                          dataKey="count"
                          nameKey="key"
                          cx="50%"
                          cy="50%"
                          outerRadius="85%"
                          innerRadius="45%"
                          paddingAngle={4}
                        >
                          {farmAnimalTypes
                            ?.filter((a) => activeFarmSections.includes(a.key))
                            .map((entry) => {
                              const color =
                                COLOR_PALETTE[
                                  farmAnimalTypes?.findIndex(
                                    (x) => x.key === entry.key
                                  ) % COLOR_PALETTE.length
                                ];
                              return (
                                <Cell
                                  key={entry.key}
                                  fill={color}
                                  strokeWidth={1}
                                />
                              );
                            })}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex flex-col gap-2">
                      {farmAnimalTypes?.map((a, i) => {
                        const active = activeFarmSections.includes(a.key);
                        return (
                          <button
                            key={a.key}
                            onClick={() =>
                              setActiveFarmSections((prev) =>
                                prev.includes(a.key)
                                  ? prev.filter((k) => k !== a.key)
                                  : [...prev, a.key]
                              )
                            }
                            className={`flex items-center gap-2 text-sm transition text-left ${
                              active ? "opacity-100" : "opacity-50 line-through"
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  COLOR_PALETTE[i % COLOR_PALETTE.length],
                                opacity: active ? 1 : 0.3,
                              }}
                            ></span>
                            <span className="flex-1 text-gray-800 dark:text-gray-200">
                              {a.name_en || a.key} — <strong>{a.count}</strong>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {petAnimalTypes?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex flex-col">
                <div className="mb-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Pet Animal Distribution
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {animalStats.petAnimals} Pet Animals
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
                  <div className="w-full md:w-1/2 h-64 md:h-72 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={petAnimalTypes?.filter((a) =>
                            activePetSections.includes(a.key)
                          )}
                          dataKey="count"
                          nameKey="key"
                          cx="50%"
                          cy="50%"
                          outerRadius="85%"
                          innerRadius="45%"
                          paddingAngle={4}
                        >
                          {petAnimalTypes
                            ?.filter((a) => activePetSections.includes(a.key))
                            .map((entry) => {
                              const color =
                                COLOR_PALETTE[
                                  petAnimalTypes?.findIndex(
                                    (x) => x.key === entry.key
                                  ) % COLOR_PALETTE.length
                                ];
                              return (
                                <Cell
                                  key={entry.key}
                                  fill={color}
                                  strokeWidth={1}
                                />
                              );
                            })}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex flex-col gap-2">
                      {petAnimalTypes?.map((a, i) => {
                        const active = activePetSections.includes(a.key);
                        return (
                          <button
                            key={a.key}
                            onClick={() =>
                              setActivePetSections((prev) =>
                                prev.includes(a.key)
                                  ? prev.filter((k) => k !== a.key)
                                  : [...prev, a.key]
                              )
                            }
                            className={`flex items-center gap-2 text-sm transition text-left ${
                              active ? "opacity-100" : "opacity-50 line-through"
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  COLOR_PALETTE[i % COLOR_PALETTE.length],
                                opacity: active ? 1 : 0.3,
                              }}
                            ></span>
                            <span className="flex-1 text-gray-800 dark:text-gray-200">
                              {a.name_en || a.key} — <strong>{a.count}</strong>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default Dashboard;
