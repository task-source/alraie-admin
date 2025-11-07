// src/pages/Breeds.tsx
import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";


interface BreedRow {
    _id: string;
    key: string;
    name_en: string;
    name_ar?: string;
    animalTypeKey?: string;
    animalTypeId?: string;
    category?: "farm" | "pet" | string;
    createdAt?: string;
    updatedAt?: string;
}

interface AnimalTypeOption {
    _id: string;
    name_en?: string | null;
    name_ar?: string | null;
    key: string;
    category?: "farm" | "pet" | string;
}

/* -------------------- Component -------------------- */

const Breeds: React.FC = () => {
    const { showApiError, showAlert } = useAlert();
    const { showLoader, hideLoader } = useLoader();

    // list state
    const [breeds, setBreeds] = useState<BreedRow[]>([]);
    const [animalTypes, setAnimalTypes] = useState<AnimalTypeOption[]>([]);

    // pagination & filters
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(1);

    const [search, setSearch] = useState<string>("");
    const [category, setCategory] = useState<string>(""); // farm | pet | ""
    const [animalTypeKeyFilter, setAnimalTypeKeyFilter] = useState<string>("");

    const [sortBy, setSortBy] = useState<string>("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // modal / form state
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [editing, setEditing] = useState<BreedRow | null>(null);

    const [form, setForm] = useState({
        key: "",
        name_en: "",
        name_ar: "",
        animalTypeKey: "",
        category: "" as string,
    });

    const keyInputRef = useRef<HTMLInputElement | null>(null);

    /* -------------------- Fetch helpers -------------------- */

    const fetchAnimalTypes = async () => {
        try {

            showLoader();
            const res = await api.get("/admin/animalType", { params: { lang: "en" } });
            if (res?.data?.success && Array.isArray(res.data.data)) {
                setAnimalTypes(res.data.data);
            } else {
                setAnimalTypes([]);
            }
        } catch (err) {
            showApiError(err);
            setAnimalTypes([]);
        } finally {
            hideLoader();
        }
    };

    const fetchBreeds = async () => {
        try {
            showLoader();
            const params: any = {
                lang: "en",
                page,
                limit,
                search: search || undefined,
                category: category || undefined,
                animalTypeKey: animalTypeKeyFilter || undefined,
                sortBy: sortBy || undefined,
                sortOrder: sortOrder || undefined,
            };

            Object.keys(params).forEach((k) => {
                if (params[k] === undefined || params[k] === "") delete params[k];
            });

            const res = await api.get("/admin/breed", { params });
            if (res?.data?.success) {
                const pagination = res.data.pagination || {};
                setPage(pagination.page || 1);
                setLimit(pagination.limit || limit);
                setTotalPages(pagination.totalPages || 1);
                setBreeds(Array.isArray(res.data.data) ? res.data.data : []);
            } else {
                setBreeds([]);
                setTotalPages(1);
            }
        } catch (err) {
            showApiError(err);
            setBreeds([]);
            setTotalPages(1);
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        fetchAnimalTypes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // reset page when filters/search change
    useEffect(() => {
        setPage(1);
    }, [search, category, animalTypeKeyFilter, limit, sortBy, sortOrder]);

    // fetch breeds on page/limit/filter changes
    useEffect(() => {
        fetchBreeds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, search, category, animalTypeKeyFilter, sortBy, sortOrder]);

    /* -------------------- Form handlers -------------------- */

    const openCreateDialog = () => {
        setEditing(null);
        setForm({ key: "", name_en: "", name_ar: "", animalTypeKey: "", category: "" });
        setOpenDialog(true);
        // focus key after next tick
        setTimeout(() => keyInputRef.current?.focus(), 100);
    };

    const openEditDialog = (breed: BreedRow) => {
        setEditing(breed);
        setForm({
            key: breed.key || "",
            name_en: breed.name_en || "",
            name_ar: breed.name_ar || "",
            animalTypeKey: breed.animalTypeKey || "",
            category: breed.category || "",
        });
        setOpenDialog(true);
        // don't focus key (not editable in edit mode), focus name
        setTimeout(() => {
            const el = document.querySelector<HTMLInputElement>('input[name="name_en"]');
            el?.focus();
        }, 100);
    };

    const closeDialog = () => {
        setOpenDialog(false);
        setEditing(null);
        setForm({ key: "", name_en: "", name_ar: "", animalTypeKey: "", category: "" });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // if user selects an animal type, auto-set category to that type's category
        if (name === "animalTypeKey") {
            const t = animalTypes.find((x) => x.key === value);
            if (t && t.category) {
                setForm((prev) => ({ ...prev, category: t.category as string }));
            }
        }
    };

    const validateForm = () => {
        if (!form.name_en?.trim()) {
            showAlert("error", "English name is required.");
            return false;
        }
        if (!editing && !form.key?.trim()) {
            showAlert("error", "Key is required for new breed.");
            return false;
        }
        if (!form.category?.trim()) {
            showAlert("error", "Please select a category.");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            showLoader();
            if (editing) {
                // update: PUT /admin/breed/:id with JSON body
                const payload = {
                    name_en: form.name_en,
                    name_ar: form.name_ar || "",
                    animalTypeKey: form.animalTypeKey || "",
                    category: form.category,
                };
                await api.put(`/admin/breed/${editing._id}`, payload);
                showAlert("success", "Breed updated successfully");
            } else {
                // create: POST /admin/breed
                const payload = {
                    key: form.key,
                    name_en: form.name_en,
                    name_ar: form.name_ar || "",
                    animalTypeKey: form.animalTypeKey || "",
                    category: form.category,
                };
                await api.post("/admin/breed", payload);
                showAlert("success", "Breed created successfully");
            }
            closeDialog();
            fetchBreeds();
        } catch (err) {
            showApiError(err);
        } finally {
            hideLoader();
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this breed?")) return;
        try {
            showLoader();
            await api.delete(`/admin/breed/${id}`);
            showAlert("success", "Breed deleted");
            // If deletion removed last item on page and page > 1, go back one page
            if (breeds.length === 1 && page > 1) {
                setPage((p) => Math.max(1, p - 1));
            } else {
                fetchBreeds();
            }
        } catch (err) {
            showApiError(err);
        } finally {
            hideLoader();
        }
    };

    /* -------------------- Table columns -------------------- */

    const columns: DataTableColumn<BreedRow>[] = [
        {
            key: "key",
            label: "Key",
            render: (r) => r.key || "—",
        },
        {
            key: "name_en",
            label: "English Name",
            render: (r) => r.name_en || "—",
        },
        {
            key: "name_ar",
            label: "Arabic Name",
            render: (r) => r.name_ar || "—",
        },
        {
            key: "animalTypeKey",
            label: "Animal Type",
            render: (r) => {
                const at = animalTypes.find((t) => t.key === r.animalTypeKey || t._id === r.animalTypeId);
                return at ? at.name_en || at.key : r.animalTypeKey || "—";
            },
        },
        {
            key: "category",
            label: "Category",
            render: (r) => (r.category ? r.category.toUpperCase() : "—"),
        },
        {
            key: "createdAt",
            label: "Created At",
            render: (r) =>
                r.createdAt ? new Date(r.createdAt).toLocaleString() : "—",
        },
        {
            key: "actions",
            label: "Actions",
            render: (r) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => openEditDialog(r)}
                        className="border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white rounded-lg px-3 py-1 text-sm transition"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleDelete(r._id)}
                        className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg px-3 py-1 text-sm transition"
                    >
                        Delete
                    </button>
                </div>
            ),
            className: "text-right",
        },
    ];

    /* -------------------- Pagination UI -------------------- */

    const renderPaginationButtons = () => {
        const buttons: React.ReactNode[] = [];
        const startPage = Math.max(1, page - 1);
        const endPage = Math.min(totalPages, page + 1);

        // Prev
        buttons.push(
            <button
                key="prev"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === 1
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
            >
                Prev
            </button>
        );

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
                <span key="ellipsis" className="px-2 text-gray-500 dark:text-gray-400 select-none">
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

        // Next
        buttons.push(
            <button
                key="next"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

    /* -------------------- Render -------------------- */

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
                <Header />

                <PageWrapper>
                    <div className="w-full max-w-full overflow-x-hidden">
                        <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
                            Breeds
                        </h1>

                        {/* Filters row */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 w-full">
                            <input
                                type="text"
                                placeholder="Search breeds..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                            />

                            <select
                                value={animalTypeKeyFilter}
                                onChange={(e) => setAnimalTypeKeyFilter(e.target.value)}
                                className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                            >
                                <option value="">All Types</option>
                                {animalTypes.map((t) => (
                                    <option key={t._id} value={t.key}>
                                        {t.name_en || t.key}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                            >
                                <option value="">All Category</option>
                                <option value="farm">Farm</option>
                                <option value="pet">Pet</option>
                            </select>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 w-full">

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                            >
                                <option value="createdAt">Sort by Created At</option>
                                <option value="name_en">Sort by Name</option>
                                <option value="key">Sort by Key</option>
                            </select>

                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                                className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                            >
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                            <button
                                onClick={() => {
                                    // re-fetch (apply)
                                    setPage(1);
                                    fetchBreeds();
                                }}
                                className="flex-1 bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm transition"
                            >
                                Apply
                            </button>

                            <button
                                onClick={() => openCreateDialog()}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
                            >
                                + Add Breed
                            </button>
                        </div>
                        
                        <DataTable<BreedRow>
                            data={breeds}
                            columns={columns}
                            onRowClick={() => { }}
                            emptyMessage="No breeds found"
                        />

                        {/* Pagination */}
                        <div className="flex flex-wrap justify-center mt-5 gap-2">
                            {renderPaginationButtons()}
                        </div>
                    </div>
                </PageWrapper>

                {/* Modal: Add / Edit Breed */}
                {openDialog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                {editing ? "Edit Breed" : "Add Breed"}
                            </h2>

                            <div className="grid grid-cols-1 gap-3">
                                {!editing && (
                                    <input
                                        name="key"
                                        ref={keyInputRef}
                                        value={form.key}
                                        onChange={handleFormChange}
                                        placeholder="Key (unique identifier)"
                                        className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                                    />
                                )}

                                <input
                                    name="name_en"
                                    value={form.name_en}
                                    onChange={handleFormChange}
                                    placeholder="English name"
                                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                                />

                                <input
                                    name="name_ar"
                                    value={form.name_ar}
                                    onChange={handleFormChange}
                                    placeholder="Arabic name (optional)"
                                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                                />

                                <select
                                    name="animalTypeKey"
                                    value={form.animalTypeKey}
                                    onChange={handleFormChange}
                                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                                >
                                    <option value="">Select Animal Type (optional)</option>
                                    {animalTypes.map((t) => (
                                        <option key={t._id} value={t.key}>
                                            {t.name_en || t.key} {t.category ? `— ${t.category}` : ""}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleFormChange}
                                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                                >
                                    <option value="">Select Category</option>
                                    <option value="farm">Farm</option>
                                    <option value="pet">Pet</option>
                                </select>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                                <button
                                    onClick={() => closeDialog()}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full sm:w-auto"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSubmit()}
                                    className="px-4 py-2 bg-[#4F46E5] hover:bg-[#0000CC] text-white rounded-lg text-sm transition w-full sm:w-auto"
                                >
                                    {editing ? "Update" : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Breeds;
