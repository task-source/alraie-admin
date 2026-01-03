import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";
import { useNavigate } from "react-router-dom";

interface Owner {
    _id: string;
    name?: string;
    email?: string;
    fullPhone?: string;
    role?: string;
}

interface Subscription {
    _id: string;
    planKey: string;
    cycle: "monthly" | "yearly";
    price: number;
    currency: string;
    status: string;
    source: string;
    startedAt?: string;
    expiresAt?: string;
    createdAt?: string;
    owner: Owner;
}

const UserSubscriptions: React.FC = () => {
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoader();
    const { showApiError } = useAlert();

    const [data, setData] = useState<Subscription[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [ownerId, setOwnerId] = useState("");
    const [debouncedOwnerId, setDebouncedOwnerId] = useState("");
    const [status, setStatus] = useState("");
    const [planKey, setPlanKey] = useState("");
    const [cycle, setCycle] = useState("");
    const [source, setSource] = useState("");
    const [currency, setCurrency] = useState("");

    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    /* ---------------- Debounce Search ---------------- */

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedOwnerId(ownerId), 500);
        return () => clearTimeout(t);
    }, [ownerId]);
    /* ---------------- Fetch ---------------- */

    const fetchSubscriptions = useCallback(async () => {
        try {
            showLoader();

            const params: any = {
                page,
                limit,
                sortBy,
                sortOrder,
            };

            if (debouncedSearch) params.search = debouncedSearch;
            if (debouncedOwnerId) params.ownerId = debouncedOwnerId;
            if (status) params.status = status;
            if (planKey) params.planKey = planKey;
            if (cycle) params.cycle = cycle;
            if (source) params.source = source;
            if (currency) params.currency = currency;

            const res = await api.get("/userSubscriptions", { params });

            if (res?.data?.success) {
                setData(res.data.data || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
            }
        } catch (err) {
            showApiError(err);
        } finally {
            hideLoader();
        }
    }, [
        page,
        limit,
        sortBy,
        sortOrder,
        debouncedSearch,
        debouncedOwnerId,
        status,
        planKey,
        cycle,
        source,
        currency,
    ]);

    useEffect(() => {
        setPage(1);
    }, [
        debouncedSearch,
        debouncedOwnerId,
        status,
        planKey,
        cycle,
        source,
        currency,
        sortBy,
        sortOrder,
    ]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    /* ---------------- Columns ---------------- */

    const columns: DataTableColumn<Subscription>[] = [
        {
            key: "owner",
            label: "User",
            render: (s) => {
                const owner = s?.owner;
                return (
                    <div>
                        <div className="font-medium">
                            {owner?.name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                            {owner?.email || owner?.fullPhone || "—"}
                        </div>
                    </div>
                );
            }
        },
        {
            key: "planKey",
            label: "Plan",
            render: (s) => s.planKey,
        },
        {
            key: "cycle",
            label: "Cycle",
            render: (s) => s.cycle?.toUpperCase(),
        },
        {
            key: "price",
            label: "Price",
            render: (s) =>
                `${Number(s?.price ?? 0)} ${s?.currency ?? "—"}`
        },
        {
            key: "status",
            label: "Status",
            render: (s) => {
                const status = s?.status ?? "unknown";
                return (
                <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${status === "active"
                            ? "bg-green-100 text-green-700"
                            : status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                >
                    {status}
                </span>
            )
        }
            ,
        },
        {
            key: "source",
            label: "Source",
            render: (s) => s.source,
        },
        {
            key: "startedAt",
            label: "Started",
            render: (s) =>
                s?.startedAt
                    ? new Date(s.startedAt).toLocaleDateString()
                    : "—"
        },
        {
            key: "expiresAt",
            label: "Expires",
            render: (s) =>
                s?.expiresAt
                    ? new Date(s.expiresAt).toLocaleDateString()
                    : "—"
        },
    ];

    /* ---------------- UI ---------------- */

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
                <Header />

                <PageWrapper>
                    <div className="px-3 sm:px-6 w-full max-w-full">

                        <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
                            User Subscriptions
                        </h1>

                        {/* Filters */}
                        <div className="flex flex-col gap-3 mb-4">

                            {/* Row 1 */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    placeholder="Search user (name / email / phone)"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                                />

                                <input
                                    type="text"
                                    placeholder="Search by Owner ID"
                                    value={ownerId}
                                    onChange={(e) => setOwnerId(e.target.value)}
                                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                                />

                                <FilterDropdown
                                    label="Status"
                                    value={status}
                                    onChange={setStatus}
                                    options={[
                                        { label: "Any Status", value: "" },
                                        { label: "Active", value: "active" },
                                        { label: "Cancelled", value: "cancelled" },
                                        { label: "Expired", value: "expired" },
                                    ]}
                                    className="flex-1"
                                />

                                <FilterDropdown
                                    label="Cycle"
                                    value={cycle}
                                    onChange={setCycle}
                                    options={[
                                        { label: "Any Cycle", value: "" },
                                        { label: "Monthly", value: "monthly" },
                                        { label: "Yearly", value: "yearly" },
                                    ]}
                                    className="flex-1"
                                />
                            </div>

                            {/* Row 2 */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <FilterDropdown
                                    label="Plan"
                                    value={planKey}
                                    onChange={setPlanKey}
                                    options={[
                                        { label: "Any Plan", value: "" },
                                        { label: "Basic", value: "basic" },
                                        { label: "Standard", value: "standard" },
                                        { label: "Professional", value: "professional" },
                                        { label: "Enterprise", value: "enterprise" },
                                    ]}
                                    className="flex-1"
                                />

                                <FilterDropdown
                                    label="Source"
                                    value={source}
                                    onChange={setSource}
                                    options={[
                                        { label: "Any Source", value: "" },
                                        { label: "Admin", value: "admin" },
                                        { label: "Stripe", value: "stripe" },
                                        { label: "Apple", value: "apple" },
                                        { label: "Google", value: "google" },
                                    ]}
                                    className="flex-1"
                                />

                                <FilterDropdown
                                    label="Sort"
                                    value={`${sortBy}_${sortOrder}`}
                                    onChange={(v) => {
                                        const [sb, so] = v.split("_");
                                        setSortBy(sb);
                                        setSortOrder(so as any);
                                    }}
                                    options={[
                                        { label: "Newest", value: "createdAt_desc" },
                                        { label: "Oldest", value: "createdAt_asc" },
                                        { label: "Expires Soon", value: "expiresAt_asc" },
                                        { label: "Plan A–Z", value: "planKey_asc" },
                                    ]}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <DataTable
                            data={data}
                            columns={columns}
                            emptyMessage="No subscriptions found"
                            onRowClick={(row) => {
                                  navigate(`/user/${row.owner._id}`);
                              }}
                        />

                        {/* Pagination */}
                        <div className="flex flex-wrap justify-center mt-5 gap-2">
                            <button
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === 1
                                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                Prev
                            </button>

                            {(() => {
                                const buttons = [];
                                const startPage = Math.max(1, page - 1);
                                const endPage = Math.min(totalPages, page + 1);

                                for (let num = startPage; num <= endPage; num++) {
                                    buttons.push(
                                        <button
                                            key={num}
                                            onClick={() => setPage(num)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === num
                                                    ? "bg-[#4F46E5] text-white"
                                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    );
                                }

                                if (endPage < totalPages - 1) {
                                    buttons.push(
                                        <span
                                            key="ellipsis"
                                            className="px-2 text-gray-500 dark:text-gray-400 select-none"
                                        >
                                            ...
                                        </span>
                                    );
                                }

                                if (endPage < totalPages) {
                                    buttons.push(
                                        <button
                                            key={totalPages}
                                            onClick={() => setPage(totalPages)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === totalPages
                                                    ? "bg-[#4F46E5] text-white"
                                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                                }`}
                                        >
                                            {totalPages}
                                        </button>
                                    );
                                }

                                return buttons;
                            })()}

                            <button
                                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === totalPages
                                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </PageWrapper>
            </main>
        </div>
    );
};

export default UserSubscriptions;
