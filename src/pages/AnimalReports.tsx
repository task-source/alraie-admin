import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { FiSearch } from "react-icons/fi";
import Modal from "../components/Modal";
import FilterDropdown from "../components/FilterDropdown";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

interface AnimalReportRow {
    _id: string;
    animalId: {
        _id?: string;
        uniqueAnimalId?: string;
        name?: string;
        profilePicture?: string;
    },
    temperature?: number;
    heartRate?: number;
    weight?: number;
    disease?: string;
    allergy?: string;
    vaccinated?: boolean;
    notes?: string;
    createdAt?: string;
}

const AnimalReports: React.FC = () => {
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoader();
    const { showAlert, showApiError } = useAlert();

    const [reports, setReports] = useState<AnimalReportRow[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [vaccinated, setVaccinated] = useState("");
    const [sort, setSort] = useState("");

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [animalId, setAnimalId] = useState("");
    const [debouncedAnimalId, setDebouncedAnimalId] = useState("");

    const [ownerId, setOwnerId] = useState("");
    const [debouncedOwnerId, setDebouncedOwnerId] = useState("");

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedAnimalId(animalId), 500);
        return () => clearTimeout(t);
    }, [animalId]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedOwnerId(ownerId), 500);
        return () => clearTimeout(t);
    }, [ownerId]);

    const fetchReports = async () => {
        try {
            showLoader();

            const params: any = {
                page,
                limit,
                search: debouncedSearch,
            };

            if (debouncedAnimalId) params.animalId = debouncedAnimalId;
            if (debouncedOwnerId) params.ownerId = debouncedOwnerId;
            if (vaccinated) params.vaccinated = vaccinated;
            if (sort) params.sort = sort;

            const res = await api.get("/animalReport", { params });

            if (res?.data?.success) {
                setReports(res.data.items || []);
                setTotal(res.data.total || 0);
            } else {
                setReports([]);
            }
        } catch (err) {
            showApiError(err);
            setReports([]);
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        setPage(1);

    }, [
        debouncedSearch,
        debouncedAnimalId,
        debouncedOwnerId,
        vaccinated,
        sort,
    ]);

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch, vaccinated, sort,
        debouncedAnimalId,
        debouncedOwnerId,
    ]);

    const handleDelete = async () => {
        if (!selectedReportId) return;
        try {
            showLoader();
            const res = await api.delete(`/animalReport/${selectedReportId}`);
            if (res?.data?.success) {
                showAlert("success", "Report deleted");
                fetchReports();
            }
        } catch (err) {
            showApiError(err);
        } finally {
            hideLoader();
            setDeleteModalOpen(false);
            setSelectedReportId(null);
        }
    };

    const renderPaginationButtons = () => {
        const buttons = [];
        const startPage = Math.max(1, page - 1);
        const endPage = Math.min(totalPages, page + 1);

        // Prev
        buttons.push(
            <button
                key="prev"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === 1
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
            >
                Prev
            </button>
        );

        // Page numbers
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

        // Ellipsis
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

        // Last page
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

        // Next
        buttons.push(
            <button
                key="next"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === totalPages
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
            >
                Next
            </button>
        );

        return buttons;
    };

    const ImageWithFallback: React.FC<{
        src?: string | null;
        alt?: string;
        className?: string;
    }> = ({ src, alt, className }) => {
        const [failed, setFailed] = useState(false);
        useEffect(() => setFailed(false), [src]);

        if (!src || failed) {
            return (
                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md border">
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                </div>
            );
        }

        return (
            <img
                src={src}
                alt={alt || "image"}
                className={className ?? "w-16 h-16 rounded-md object-cover border"}
                onError={() => setFailed(true)}
            />
        );
    };

    const columns: DataTableColumn<AnimalReportRow>[] = [
        {
            key: "animalId",
            label: "Animal ID",
            render: (r) => r.animalId?._id,
        },
        {
            key: "animal",
            label: "Animal",
            render: (r) =>
                <div className="flex items-center gap-2">
                    <ImageWithFallback
                        src={r.animalId?.profilePicture || null}
                        alt={r.animalId.name}
                        className="w-10 h-10 rounded-md object-cover border"
                    />
                    <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {r.animalId.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {r.animalId.uniqueAnimalId || "—"}
                        </div>
                    </div>
                </div>,
        },
        {
            key: "temperature",
            label: "Temp (°C)",
            render: (r) => r.temperature ?? "—",
        },
        {
            key: "heartRate",
            label: "Heart Rate",
            render: (r) => r.heartRate ?? "—",
        },
        {
            key: "weight",
            label: "Weight",
            render: (r) => r.weight ?? "—",
        },
        {
            key: "disease",
            label: "Disease",
            render: (r) => r.disease || "—",
        },
        {
            key: "vaccinated",
            label: "Vaccinated",
            render: (r) => (
                <span
                    className={`px-2 py-0.5 text-xs rounded-md font-medium ${r.vaccinated
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                >
                    {r.vaccinated ? "Yes" : "No"}
                </span>
            ),
        },
        {
            key: "createdAt",
            label: "Created At (UTC)",
            render: (r) =>
                r.createdAt
                    ? new Date(r.createdAt).toLocaleString(undefined, {
                        timeZone: "UTC",
                    })
                    : "—",
        },
        {
            key: "actions",
            label: "Actions",
            render: (r) => (
                <button
                    onClick={() => {
                        setSelectedReportId(r._id);
                        setDeleteModalOpen(true);
                    }}
                    className="px-3 py-1 rounded-md border border-red-600 text-red-600 hover:bg-red-50 text-xs"
                >
                    Delete
                </button>
            ),
        },
    ];

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
                <Header />

                <PageWrapper>
                    <div className="px-3 sm:px-6 w-full max-w-full overflow-x-hidden">

                        <h1 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
                            Animal Reports
                        </h1>

                        {/* Filters */}
                        <div className="flex flex-col md:items-center gap-3 mb-4 w-full">

                            {/* Row 1: Search */}
                            <div className="flex gap-3 flex-col sm:flex-row w-full">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search disease / allergy / notes..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-10 py-2 focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                                    />
                                    <div className="absolute left-3 top-2.5 text-gray-400">
                                        <FiSearch />
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Animal ID + Owner ID */}
                            <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                                <input
                                    type="text"
                                    placeholder="Animal ID"
                                    value={animalId}
                                    onChange={(e) => setAnimalId(e.target.value)}
                                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white w-full"
                                />

                                <input
                                    type="text"
                                    placeholder="Owner ID"
                                    value={ownerId}
                                    onChange={(e) => setOwnerId(e.target.value)}
                                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white w-full"
                                />
                            </div>

                            {/* Row 3: Vaccinated + Sort + Apply */}
                            <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center w-full">
                                <FilterDropdown
                                    label="Vaccinated"
                                    value={vaccinated}
                                    onChange={setVaccinated}
                                    className="flex-1 w-full"
                                    options={[
                                        { label: "Vaccinated (Any)", value: "" },
                                        { label: "Yes", value: "true" },
                                        { label: "No", value: "false" },
                                    ]}
                                />

                                <FilterDropdown
                                    label="Sort"
                                    value={sort}
                                    onChange={setSort}
                                    className="flex-1 w-full"
                                    options={[
                                        { label: "Latest", value: "" },
                                        { label: "Heart Rate ↓", value: "heart_rate_high_to_low" },
                                        { label: "Heart Rate ↑", value: "heart_rate_low_to_high" },
                                        { label: "Weight ↓", value: "weight_high_to_low" },
                                        { label: "Weight ↑", value: "weight_low_to_high" },
                                    ]}
                                />

                                <button
                                    onClick={() => fetchReports()}
                                    className="flex-1 bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm w-full transition"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        <DataTable<AnimalReportRow>
                            data={reports}
                            columns={columns}
                            onRowClick={(row) => navigate(`/animal/${row.animalId?._id}`)}
                            emptyMessage="No reports found"
                        />

                        {/* Pagination */}
                        <div className="flex flex-wrap justify-center mt-5 gap-2">
                            {renderPaginationButtons()}
                        </div>
                    </div>
                </PageWrapper>
            </main>

            <Modal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Report?"
                description="This will permanently delete this report."
                confirmText="Yes, Delete"
                cancelText="Cancel"
                confirmColor="danger"
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default AnimalReports;
