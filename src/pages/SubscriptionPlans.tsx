import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { FiSearch } from "react-icons/fi";
import FilterDropdown from "../components/FilterDropdown";
import { useNavigate } from "react-router-dom";

interface PlanRow {
  _id: string;
  planKey: string;
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  maxAnimals?: number;
  maxAssistants?: number;
  isPublic?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  const { showApiError } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /* ---------------- Filters ---------------- */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [planKey, setPlanKey] = useState("");
  const [debouncedPlanKey, setDebouncedPlanKey] = useState("");
  const [isActive, setIsActive] = useState("");
  const [isPublic, setIsPublic] = useState("");

  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  /* ---------------- Debounce ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPlanKey(planKey), 500);
    return () => clearTimeout(t);
  }, [planKey]);
  /* ---------------- Fetch ---------------- */
  const fetchPlans = async () => {
    try {
      showLoader();

      const params: any = {
        page,
        limit,
        sortBy,
        order,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (debouncedPlanKey) params.planKey = debouncedPlanKey;
      if (isActive !== "") params.isActive = isActive;
      if (isPublic !== "") params.isPublic = isPublic;

      const res = await api.get("/subscriptionPlan", { params });

      if (res.data?.success) {
        setPlans(res.data.data || []);
        setTotalPages(res.data.meta?.totalPages || 1);
      } else {
        setPlans([]);
      }
    } catch (err) {
      showApiError(err);
      setPlans([]);
    } finally {
      hideLoader();
    }
  };

  /* reset page on filter change */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedPlanKey, isActive, isPublic, sortBy, order]);

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    debouncedSearch,
    debouncedPlanKey,
    isActive,
    isPublic,
    sortBy,
    order,
  ]);

  const toggleActive = async (plan: PlanRow) => {
    try {
      showLoader();
      await api.put(
        `/subscriptionPlan/${plan._id}/${
          plan.isActive ? "deactivate" : "activate"
        }`
      );
      fetchPlans();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  /* ---------------- Columns ---------------- */
  const columns: DataTableColumn<PlanRow>[] = [
    {
      key: "planKey",
      label: "Plan Key",
      render: (p) => <span className="font-mono text-sm">{p.planKey}</span>,
    },
    {
      key: "name",
      label: "Name",
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-medium">{p.name_en || "—"}</span>
          <span className="text-xs text-gray-500">{p.name_ar || "—"}</span>
        </div>
      ),
    },
    {
      key: "limits",
      label: "Limits",
      render: (p) => (
        <div className="text-sm">
          Animals: {p.maxAnimals ?? "—"} <br />
          Assistants: {p.maxAssistants ?? "—"}
        </div>
      ),
    },
    {
      key: "public",
      label: "Public",
      render: (p) => (
        <span
          className={`px-2 py-0.5 text-xs rounded-md ${
            p.isPublic
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {p.isPublic ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "active",
      label: "Status",
      render: (p) => (
        <span
          className={`px-2 py-0.5 text-xs rounded-md ${
            p.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {p.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (p) =>
        p.createdAt ? new Date(p.createdAt).toLocaleString() : "—",
    },
    {
      key: "actions",
      label: "Actions",
      render: (p) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
                e.stopPropagation();
                toggleActive(p)}}
            className={`px-3 py-1 rounded-md text-xs font-medium border transition ${
              p.isActive
                ? "border-red-600 text-red-600 hover:bg-red-50"
                : "border-green-600 text-green-600 hover:bg-green-50"
            }`}
          >
            {p.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={(e) => {
                e.stopPropagation();
                navigate(`/subscriptions/plans/${p._id}/edit`)}
            }
            className="px-3 py-1 border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white text-xs rounded-md"
          >
            Edit
          </button>
        </div>
      ),
    },
  ];

  /* ---------------- Pagination ---------------- */
  const renderPaginationButtons = () => {
    const buttons = [];
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

    buttons.push(
      <button
        key="prev"
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={page === 1}
        className={`px-3 py-1 rounded-md text-sm ${
          page === 1
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
      >
        Prev
      </button>
    );

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 rounded-md text-sm ${
            page === i
              ? "bg-[#4F46E5] text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      buttons.push(
        <button
          key="next"
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
        >
          Next
        </button>
      );
    }

    return buttons;
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col w-full min-w-0">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 w-full">
            <div className="flex gap-3 items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold dark:text-white">
                Subscription Plans
              </h1>
              <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/subscriptions/plans/new")}
                className="bg-[#4F46E5] hover:bg-[#0000CC] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                + Create Subscription
              </button>

              <button
                onClick={() => navigate("/subscriptions/plans/assign")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
              >
                Assign Subscription
              </button>
              </div>
            </div>
            {/* Filters */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    placeholder="Search plans..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border rounded-lg px-10 py-2 text-sm dark:bg-gray-800 dark:text-white"
                  />
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                </div>

                <input
                  placeholder="Plan Key"
                  value={planKey}
                  onChange={(e) => setPlanKey(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <FilterDropdown
                  label="Active"
                  value={isActive}
                  onChange={setIsActive}
                  options={[
                    { label: "All", value: "" },
                    { label: "Active", value: "true" },
                    { label: "Inactive", value: "false" },
                  ]}
                  className="flex-1"
                />

                <FilterDropdown
                  label="Public"
                  value={isPublic}
                  onChange={setIsPublic}
                  options={[
                    { label: "All", value: "" },
                    { label: "Public", value: "true" },
                    { label: "Private", value: "false" },
                  ]}
                  className="flex-1"
                />

                <FilterDropdown
                  label="Sort By"
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { label: "Created At", value: "createdAt" },
                    { label: "Plan Key", value: "planKey" },
                    { label: "Max Animals", value: "maxAnimals" },
                    { label: "Max Assistants", value: "maxAssistants" },
                  ]}
                  className="flex-1"
                />

                <FilterDropdown
                  label="Order"
                  value={order}
                  onChange={setOrder}
                  options={[
                    { label: "Descending", value: "desc" },
                    { label: "Ascending", value: "asc" },
                  ]}
                  className="flex-1"
                />
              </div>
            </div>

            <DataTable<PlanRow>
              data={plans}
              columns={columns}
              emptyMessage="No subscription plans found"
              onRowClick={(row) => navigate(`/subscriptions/plans/${row._id}`)}
            />

            <div className="flex justify-center mt-5 gap-2">
              {renderPaginationButtons()}
            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
};

export default SubscriptionPlans;
