import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import Modal from "../components/Modal";
import FilterDropdown from "../components/FilterDropdown";

import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";

import { DataTable, DataTableColumn } from "../components/DataTable";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface PlanDetail {
  _id: string;
  planKey: string;
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  features_en?: string[];
  features_ar?: string[];
  maxAnimals?: number;
  maxAssistants?: number;
  iosProductId_monthly?: string;
  iosProductId_yearly?: string;
  androidProductId_monthly?: string;
  androidProductId_yearly?: string;
  isPublic?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SubscriptionRow {
  _id: string;
  planKey: string;
  cycle: string;
  status: string;
  source: string;
  currency: string;
  price: number;
  startedAt?: string;
  expiresAt?: string;
  owner?: {
    _id?: string;
    name?: string;
    email?: string;
    fullPhone?: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

const PlanDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { showLoader, hideLoader } = useLoader();
  const { showApiError, showAlert } = useAlert();

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);

  /* ---------------- SUBSCRIPTIONS STATE ---------------- */

  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("");
  const [cycle, setCycle] = useState("");
  const [source, setSource] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [ownerId, setOwnerId] = useState("");
const [ownerIdDebounced, setOwnerIdDebounced] = useState("");

  /* -------------------------------------------------------------------------- */
  /*                               FETCH PLAN                                   */
  /* -------------------------------------------------------------------------- */

  const fetchPlan = async () => {
    if (!id) return;
    try {
      showLoader();
      const res = await api.get(`/subscriptionPlan/${id}`);
      if (res?.data?.success) {
        setPlan(res.data.data);
      }
    } catch (err) {
      showApiError(err);
      navigate(-1);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [id]);

  /* -------------------------------------------------------------------------- */
  /*                           SUBSCRIPTIONS LIST                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setOwnerIdDebounced(ownerId.trim());
    }, 500);
  
    return () => clearTimeout(t);
  }, [ownerId]);
  const fetchSubscriptions = async () => {
    if (!plan?.planKey) return;

    try {
      showLoader();

      const params: any = {
        page,
        limit,
        planKey: plan.planKey,
        search: debouncedSearch || undefined,
        ownerId: ownerIdDebounced|| undefined,
        status: status || undefined,
        cycle: cycle || undefined,
        source: source || undefined,
        sortBy,
        sortOrder,
      };

      Object.keys(params).forEach(
        (k) => params[k] === undefined && delete params[k]
      );

      const res = await api.get("/userSubscriptions", { params });

      if (res?.data?.success) {
        setSubs(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setSubs([]);
        setTotalPages(1);
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const handleTogglePlan = async () => {
    if (!plan?._id) return;
  
    try {
      showLoader();
  
      const res = await api.put(`/subscriptionPlan/${plan._id}`, {
        isActive: !plan.isActive,
      });
  
      if (res?.data?.success) {
        setPlan((p) =>
          p ? { ...p, isActive: !p.isActive } : p
        );
        showAlert(
          "success",
          `Plan ${plan.isActive ? "deactivated" : "activated"}`
        );
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  
  useEffect(() => {
    fetchSubscriptions();
  }, [
    plan?.planKey,
    page,
    debouncedSearch,
    ownerIdDebounced,
    status,
    cycle,
    source,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, cycle, source, sortBy, sortOrder,  ownerIdDebounced,]);

  /* -------------------------------------------------------------------------- */
  /*                                TABLE COLUMNS                               */
  /* -------------------------------------------------------------------------- */

  const columns: DataTableColumn<SubscriptionRow>[] = [
    {
      key: "owner",
      label: "User",
      render: (s) => (
        <div>
          <div className="font-medium">{s.owner?.name || "N/A"}</div>
          <div className="text-xs text-gray-500">
            {s.owner?.email || s.owner?.fullPhone || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "cycle",
      label: "Cycle",
      render: (s) => s.cycle || "—",
    },
    {
      key: "price",
      label: "Price",
      render: (s) => `${s.price ?? 0} ${s.currency ?? "—"}`,
    },
    {
      key: "status",
      label: "Status",
    },
    {
      key: "source",
      label: "Source",
    },
    {
      key: "startedAt",
      label: "Started",
      render: (s) =>
        s.startedAt ? new Date(s.startedAt).toLocaleDateString() : "—",
    },
    {
      key: "expiresAt",
      label: "Expires",
      render: (s) =>
        s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : "—",
    },
  ];

  /* -------------------------------------------------------------------------- */
  /*                              PAGINATION (COPIED)                            */
  /* -------------------------------------------------------------------------- */

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

    return (
      <>
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            page === 1
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Prev
        </button>

        {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
          const p = startPage + i;
          return (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                page === p
                  ? "bg-[#4F46E5] text-white"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            page === totalPages
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Next
        </button>
      </>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 w-full min-w-0">

            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">
                Subscription Plan Details
              </h1>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="px-3 py-1 rounded-lg border text-sm dark:text-white"
                >
                  Back
                </button>
                <button
                  onClick={() => navigate(`/subscriptions/plans/${plan?._id}/edit`)}
                  className="px-3 py-1 rounded-lg border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white text-sm"
                >
                  Edit
                </button>
                <button
  onClick={() => setToggleModalOpen(true)}
  className={`px-3 py-1 rounded-lg border text-sm ${
    plan?.isActive
      ? "border-red-600 text-red-600"
      : "border-green-600 text-green-600"
  }`}
>
  {plan?.isActive ? "Deactivate" : "Activate"}
</button>
              </div>
            </div>

            {/* PLAN INFO */}
            {plan && (
              <div className="rounded-xl border bg-white dark:bg-gray-800 p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {Object.entries({
                  "Plan Key": plan.planKey,
                  "Name (EN)": plan.name_en,
                  "Name (AR)": plan.name_ar,
                  "Max Animals": plan.maxAnimals,
                  "Max Assistants": plan.maxAssistants,
                  Public: plan.isPublic ? "Yes" : "No",
                  Active: plan.isActive ? "Yes" : "No",
                  "Description (EN)": plan.description_en,
                  "Description (AR)": plan.description_ar,
                }).map(([k, v]) =>
                  v !== undefined && v !== "" ? (
                    <div key={k}>
                      <div className="text-xs uppercase text-gray-500">{k}</div>
                      <div className="text-gray-900 dark:text-white break-all">
                        {String(v)}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}

{plan?.features_en?.length ? (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
      Features (English)
    </h2>

    <div className="space-y-3">
      {plan.features_en.map((feature, index) => (
        <div
          key={index}
          className="border rounded-xl bg-white dark:bg-gray-800 px-5 py-3 text-sm text-gray-700 dark:text-gray-300"
        >
          • {feature}
        </div>
      ))}
    </div>
  </div>
) : null}

{plan?.features_ar?.length ? (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
      Features (Arabic)
    </h2>

    <div className="space-y-3">
      {plan.features_ar.map((feature, index) => (
        <div
          key={index}
          dir="rtl"
          className="border rounded-xl bg-white dark:bg-gray-800 px-5 py-3 text-sm text-gray-700 dark:text-gray-300 text-right"
        >
          • {feature}
        </div>
      ))}
    </div>
  </div>
) : null}
            {/* SUBSCRIPTIONS */}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
              Users with this plan
            </h2>

            {/* FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
              />

              <FilterDropdown
                label="Status"
                value={status}
                onChange={setStatus}
                className="flex-1"
                options={[
                  { label: "All", value: "" },
                  { label: "Active", value: "active" },
                  { label: "Cancelled", value: "cancelled" },
                  { label: "Expired", value: "expired" },
                ]}
              />

              <FilterDropdown
                label="Cycle"
                value={cycle}
                onChange={setCycle}
                className="flex-1"
                options={[
                  { label: "All", value: "" },
                  { label: "Monthly", value: "monthly" },
                  { label: "Yearly", value: "yearly" },
                ]}
              />

              <FilterDropdown
                label="Source"
                value={source}
                onChange={setSource}
                className="flex-1"
                options={[
                  { label: "All", value: "" },
                  { label: "Admin", value: "admin" },
                  { label: "Stripe", value: "stripe" },
                ]}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4 w-full">
            <input
  type="text"
  placeholder="Filter by Owner ID"
  value={ownerId}
  onChange={(e) => setOwnerId(e.target.value)}
  className="flex-1 border border-gray-300 dark:border-gray-700
             bg-white dark:bg-gray-800 text-sm rounded-lg
             px-3 py-2 w-full sm:w-64
             focus:ring-2 focus:ring-[#4F46E5]
             outline-none dark:text-white"
/>
  <FilterDropdown
    label="Sort By"
    value={sortBy}
    onChange={setSortBy}
    className="w-full sm:w-48 flex-1"
    options={[
      { label: "Created At", value: "createdAt" },
      { label: "Started At", value: "startedAt" },
      { label: "Expires At", value: "expiresAt" },
      { label: "Plan Key", value: "planKey" },
    ]}
  />

  <FilterDropdown
    label="Order"
    value={sortOrder}
    onChange={setSortOrder}
    className="w-full sm:w-40 flex-1"
    options={[
      { label: "Descending", value: "desc" },
      { label: "Ascending", value: "asc" },
    ]}
  />
</div>
            <DataTable
              data={subs}
              columns={columns}
              emptyMessage="No subscriptions found"
              onRowClick={(row) => {
                navigate(`/user/${row.owner?._id}`);
            }}
            />

            <div className="flex justify-center mt-4 gap-2">
              {renderPagination()}
            </div>
          </div>
        </PageWrapper>
      </main>

      {/* DELETE MODAL */}
      <Modal
  open={toggleModalOpen}
  onClose={() => setToggleModalOpen(false)}
  title={`${plan?.isActive ? "Deactivate" : "Activate"} Plan?`}
  description={`This will ${
    plan?.isActive ? "disable" : "enable"
  } this subscription plan for users.`}
  confirmText={plan?.isActive ? "Deactivate" : "Activate"}
  cancelText="Cancel"
  confirmColor={plan?.isActive ? "danger" : "primary"}
  onConfirm={() => {
    setToggleModalOpen(false);
    handleTogglePlan();
  }}
/>
    </div>
  );
};

export default PlanDetails;
