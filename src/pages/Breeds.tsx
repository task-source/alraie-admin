// src/pages/Breeds.tsx
import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal"; // <-- Added import for reusable modal component


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

interface BulkUploadResult {
  success?: boolean;
  message?: string;
  summary?: {
    created?: number;
    skipped?: number;
    total?: number;
  } | null;
  errors?: Array<{ key?: string; reason?: string }>;
}

const MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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

    // NEW: confirmation modal state (for delete)
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
    const [breedToDelete, setBreedToDelete] = useState<BreedRow | null>(null);

  // bulk upload modals
  const [bulkModalOpen, setBulkModalOpen] = useState<boolean>(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkFileName, setBulkFileName] = useState<string>("");
  const [bulkFileError, setBulkFileError] = useState<string | null>(null);
  const [, setUploadingBulk] = useState<boolean>(false);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState<boolean>(false);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);

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

    const handleDeleteConfirmed = async (id: string) => {

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
            // close modal and reset
            setConfirmOpen(false);
            setBreedToDelete(null);
        }
    };

  /* -------------------- BULK UPLOAD HANDLERS -------------------- */

  const resetBulkUploader = () => {
    setBulkFile(null);
    setBulkFileName("");
    setBulkFileError(null);
    if (bulkInputRef.current) bulkInputRef.current.value = "";
  };

  const handleBulkFileSelect = (file: File | null) => {
    setBulkFileError(null);
    if (!file) {
      resetBulkUploader();
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext !== "csv") {
      setBulkFileError("Please upload a .csv file.");
      return;
    }
    if (file.size > MAX_CSV_SIZE_BYTES) {
      setBulkFileError("File too large. Max allowed size is 10 MB.");
      return;
    }
    setBulkFile(file);
    setBulkFileName(file.name);
  };

  const onBulkInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    handleBulkFileSelect(f);
  };

  const uploadBulkFile = async () => {
    if (!bulkFile) {
      setBulkFileError("Please select a CSV file to continue.");
      return;
    }

    try {
      showLoader();
      setUploadingBulk(true);
      const fd = new FormData();
      fd.append("file", bulkFile);

      const res = await api.post("/admin/breed/bulkUpload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res?.data ?? null;
      if (data?.success) showAlert("success", data.message || "CSV uploaded");
      else showAlert("error", data?.message || "Upload failed");

      setBulkResult({
        success: data?.success,
        message: data?.message,
        summary: data?.summary ?? null,
        errors: Array.isArray(data?.errors) ? data.errors : [],
      });

      setResultModalOpen(true);
      fetchBreeds();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setUploadingBulk(false);
      setBulkModalOpen(false);
      resetBulkUploader();
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
                        onClick={() => {
                            // Open confirmation modal instead of immediate browser confirm
                            setBreedToDelete(r);
                            setConfirmOpen(true);
                        }}
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
                    <div className="w-full max-w-full px-2 overflow-x-hidden">
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
                              onClick={() => setBulkModalOpen(true)}
                              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg px-4 py-2 text-sm transition"
                          >
                              Upload CSV
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
                                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm text-gray-400 focus:ring-2 focus:ring-[#4F46E5] outline-none"
                                />

                                <input
                                    name="name_ar"
                                    value={form.name_ar}
                                    onChange={handleFormChange}
                                    placeholder="Arabic name (optional)"
                                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm text-gray-400 focus:ring-2 focus:ring-[#4F46E5] outline-none"
                                />

                                <select
                                    name="animalTypeKey"
                                    value={form.animalTypeKey}
                                    onChange={handleFormChange}
                                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm text-gray-400 focus:ring-2 focus:ring-[#4F46E5] outline-none"
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
                                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm text-gray-400 focus:ring-2 focus:ring-[#4F46E5] outline-none"
                                >
                                    <option value="">Select Category</option>
                                    <option value="farm">Farm</option>
                                    <option value="pet">Pet</option>
                                </select>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                                <button
                                    onClick={() => closeDialog()}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full sm:w-auto"
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

                {/* Confirmation Modal for Delete */}
                <Modal
                    open={confirmOpen}
                    onClose={() => {
                        setConfirmOpen(false);
                        setBreedToDelete(null);
                    }}
                    title="Delete Breed"
                    description={`Are you sure you want to delete "${breedToDelete?.name_en}"? This action cannot be undone.`}
                    confirmText="Yes, Delete"
                    cancelText="Cancel"
                    confirmColor="danger"
                    onConfirm={() => {
                        if (breedToDelete) handleDeleteConfirmed(breedToDelete._id);
                    }}
                />

        {/* Bulk Upload Modal */}
        <Modal
          open={bulkModalOpen}
          onClose={() => {
            setBulkModalOpen(false);
            resetBulkUploader();
          }}
          title="Bulk Upload Breeds (CSV)"
          confirmText="Continue"
          cancelText="Cancel"
          confirmColor="primary"
          onConfirm={uploadBulkFile}
        >
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>
              To bulk upload breeds, your CSV must include the mandatory columns:
            </p>
            <ul className="list-disc pl-5">
              <li><strong>name_en</strong></li>
              <li><strong>name_ar</strong></li>
              <li><strong>key</strong></li>
              <li><strong>category</strong></li>
              <li><strong>animalTypeKey</strong></li>
            </ul>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleBulkFileSelect(e.dataTransfer.files?.[0] ?? null);
              }}
              className="mt-3 border border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800"
            >
              <div className="text-sm">Drag & drop CSV here</div>
              <div className="text-xs text-gray-500">or</div>
              <label className="cursor-pointer">
                <input
                  ref={bulkInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onBulkInputChange}
                  className="hidden"
                />
                <span className="px-3 py-1 bg-[#4F46E5] text-white rounded-md text-sm">
                  Choose CSV
                </span>
              </label>
              {bulkFileName && (
                <div className="text-sm mt-2">
                  Selected: <strong>{bulkFileName}</strong>
                </div>
              )}
              {bulkFileError && (
                <div className="text-sm text-red-500 mt-2">{bulkFileError}</div>
              )}
            </div>
          </div>
        </Modal>

        {/* Result Modal */}
        <Modal
          open={resultModalOpen}
          onClose={() => {
            setResultModalOpen(false);
            setBulkResult(null);
          }}
          title="Bulk Upload Result"
          confirmText="OK"
          cancelText="Close"
          confirmColor="primary"
          onConfirm={() => {
            setResultModalOpen(false);
            setBulkResult(null);
          }}
        >
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
            <div>
              <strong>Message:</strong>{" "}
              {bulkResult?.message || "No message provided"}
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-xs text-gray-500">Created</div>
                <div className="text-lg font-semibold">
                  {bulkResult?.summary?.created ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Skipped</div>
                <div className="text-lg font-semibold">
                  {bulkResult?.summary?.skipped ?? 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-lg font-semibold">
                  {bulkResult?.summary?.total ?? 0}
                </div>
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">Skipped Rows</div>
              <div className="max-h-60 overflow-auto border rounded-md p-2 bg-white dark:bg-gray-800">
                {Array.isArray(bulkResult?.errors) &&
                bulkResult?.errors.length ? (
                  bulkResult.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start py-2 border-b last:border-0"
                    >
                      <div>
                        <div className="font-medium">{err?.key ?? "[no key]"}</div>
                        <div className="text-xs text-gray-500">
                          {err?.reason ?? "Unknown reason"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No skipped rows.</div>
                )}
              </div>
            </div>
          </div>
        </Modal>
            </main>
        </div>
    );
};

export default Breeds;
