// src/pages/AnimalTypes.tsx
import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { PhotoIcon } from "@heroicons/react/24/outline";
import Modal from "../components/Modal"; // <-- Added import for reusable modal component

type Category = "farm" | "pet" | "";

interface AnimalType {
  _id: string;
  name_en: string;
  name_ar: string;
  key: string;
  category: "farm" | "pet";
  createdAt: string;
  imageUrl?: string | null; // optional, may be missing
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

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB for csv (sane default)

const AnimalTypes: React.FC = () => {
  const { showAlert, showApiError } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [category, setCategory] = useState<Category>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editing, setEditing] = useState<AnimalType | null>(null);

  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    key: "",
    category: "" as Category,
  });

  // Image handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // NEW: confirmation modal state (for delete)
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [animalTypeToDelete, setAnimalTypeToDelete] = useState<AnimalType | null>(null);

  // ---------- BULK UPLOAD STATES ----------
  const [bulkModalOpen, setBulkModalOpen] = useState<boolean>(false); // info + uploader modal
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkFileName, setBulkFileName] = useState<string>("");
  const [bulkFileError, setBulkFileError] = useState<string | null>(null);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);

  const [, setUploadingBulk] = useState<boolean>(false);
  const [resultModalOpen, setResultModalOpen] = useState<boolean>(false);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);
  // -----------------------------------------

  // load animal types
  const fetchAnimalTypes = async () => {
    try {
      showLoader();
      const params: any = {};


      if (category) params.category = category;
      const res = await api.get("/admin/animalType", { params });
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

  useEffect(() => {
    fetchAnimalTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleOpenDialog = (animal?: AnimalType) => {
    if (animal) {
      setEditing(animal);
      setFormData({
        name_en: animal.name_en || "",
        name_ar: animal.name_ar || "",
        key: animal.key || "",
        category: animal.category || "",
      });
      setSelectedFile(null);
      setPreviewUrl(animal.imageUrl ?? null);
    } else {
      setEditing(null);
      setFormData({ name_en: "", name_ar: "", key: "", category: "" });
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    // cleanup preview objectURL if we created one
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setOpenDialog(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateAndSetFile = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return true;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      showAlert("error", "Only JPG, PNG, WEBP or GIF images are allowed.");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showAlert("error", "Image too large. Max allowed size is 5 MB.");
      return false;
    }
    // create preview
    const url = URL.createObjectURL(file);
    // revoke previous if blob
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(url);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    validateAndSetFile(f);
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    // also clear file input value
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    // basic validation
    if (!formData.name_en?.trim()) {
      showAlert("error", "English name is required.");
      return;
    }
    if (!formData.category) {
      showAlert("error", "Please select a category.");
      return;
    }

    try {
      showLoader();

      // Build FormData for API (image key should be 'image')
      const fd = new FormData();
      fd.append("name_en", formData.name_en);
      fd.append("name_ar", formData.name_ar || "");
      fd.append("key", formData.key || "");
      fd.append("category", formData.category);

      // if a new file is selected, append it
      if (selectedFile) {
        fd.append("image", selectedFile);
      }

      if (editing) {
        // Update - PUT with FormData
        await api.put(`/admin/animalType/${editing._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("success", "Animal type updated successfully");
      } else {
        // Create - POST with FormData
        await api.post("/admin/animalType", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("success", "Animal type created successfully");
      }

      // refresh list and close dialog
      fetchAnimalTypes();
      handleCloseDialog();
    } catch (err: any) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const handleDeleteConfirmed = async (id: string) => {
    
    try {
      showLoader();
      await api.delete(`/admin/animalType/${id}`);
      showAlert("success", "Animal type deleted");
      fetchAnimalTypes();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setConfirmOpen(false);
      setAnimalTypeToDelete(null);
    }
  };

  const columns: DataTableColumn<AnimalType>[] = [
    {
      key: "image",
      label: "Image",
      render: (a) => {
        const src = a.imageUrl ?? "";
        return (
          <div className="flex items-center">
            {src ? (
              <img
                src={src}
                alt={a.name_en || a.key}
                onError={(e: any) => {
                  // fallback to icon if remote image fails
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "";
                }}
                className="w-12 h-12 rounded-md object-cover border"
                style={{ display: src ? undefined : "none" }}
              />
            ) : (
              <div className="w-12 h-12 rounded-md border flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                <PhotoIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "name_en",
      label: "English Name",
      render: (a) => a.name_en || "—",
    },
    {
      key: "name_ar",
      label: "Arabic Name",
      render: (a) => a.name_ar || "—",
    },
    {
      key: "key",
      label: "Key",
      render: (a) => a.key || "—",
    },
    {
      key: "category",
      label: "Category",
      render: (a) => (
        <span className="capitalize text-gray-800 dark:text-gray-200">
          {a.category || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (a) =>
        a.createdAt
          ? new Date(a.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "—",
    },
    {
      key: "actions",
      label: "Actions",
      render: (a) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleOpenDialog(a)}
            className="border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white rounded-lg px-3 py-1 text-sm transition"
          >
            Edit
          </button>
          <button
            onClick={() => {
              // Open confirmation modal instead of immediate browser confirm
              setAnimalTypeToDelete(a);
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

  /* ---------------- RENDER ---------------- */

  /* ---------- BULK UPLOAD HELPERS ---------- */

  const resetBulkUploader = () => {
    setBulkFile(null);
    setBulkFileName("");
    setBulkFileError(null);
    if (bulkInputRef.current) bulkInputRef.current.value = "";
  };

  const onDropBulk = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    handleBulkFileSelect(f);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleBulkFileSelect = (file: File | null) => {
    setBulkFileError(null);
    if (!file) {
      resetBulkUploader();
      return;
    }
    const name = file.name || "";
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (ext !== "csv") {
      setBulkFile(null);
      setBulkFileName("");
      setBulkFileError("Please upload a .csv file.");
      return;
    }
    if (file.size > MAX_CSV_SIZE_BYTES) {
      setBulkFile(null);
      setBulkFileName("");
      setBulkFileError("File too large. Max allowed size is 10 MB.");
      return;
    }
    setBulkFile(file);
    setBulkFileName(name);
    setBulkFileError(null);
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
      setUploadingBulk(true);
      showLoader();
      // Use FormData and your api (Authorization handled by api instance)
      const fd = new FormData();
      fd.append("file", bulkFile);

      const res = await api.post("/admin/animalType/bulkUpload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // handle response safely
      const data = res?.data ?? null;
      if (data && data.success) {
        showAlert("success", data.message || "CSV uploaded successfully");
      } else if (data && !data.success) {
        // server responded with success:false
        showAlert("error", data.message || "CSV upload failed");
      }

      setBulkResult({
        success: data?.success,
        message: data?.message,
        summary: data?.summary ?? null,
        errors: Array.isArray(data?.errors) ? data.errors : [],
      });

      // show result modal
      setResultModalOpen(true);

      // refresh list after upload
      fetchAnimalTypes();
    } catch (err: any) {
      // network or unexpected errors
      showApiError(err);
    } finally {
      hideLoader();
      setUploadingBulk(false);
      // keep bulk modal open? We can close info modal and open result modal.
      setBulkModalOpen(false);
      // keep file selected? reset uploader after showing result
      resetBulkUploader();
    }
  };

  /* ---------------------------------------- */

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <PageWrapper>
          <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
            Animal Types
          </h1>

          {/* Filters + Add + Bulk Upload */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4 w-full">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full sm:w-48 focus:ring-2 focus:ring-[#4F46E5] outline-none"
            >
              <option value="">All Categories</option>
              <option value="farm">Farm</option>
              <option value="pet">Pet</option>
            </select>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setBulkModalOpen(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg px-4 py-2 transition-all w-full sm:w-auto"
                title="Bulk upload CSV"
              >
                Upload CSV
              </button>

              <button
                onClick={() => handleOpenDialog()}
                className="bg-[#4F46E5] hover:bg-[#0000CC] text-white text-sm font-medium rounded-lg px-4 py-2 transition-all w-full sm:w-auto"
              >
                + Add Animal Type
              </button>
            </div>
          </div>

          <DataTable<AnimalType>
            data={animalTypes}
            columns={columns}
            emptyMessage="No animal types found"
          />

          {/* Dialog */}
          {openDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  {editing ? "Edit Animal Type" : "Add Animal Type"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      name="name_en"
                      placeholder="English Name"
                      value={formData.name_en}
                      onChange={handleChange}
                      className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                    />
                    <input
                      type="text"
                      name="name_ar"
                      placeholder="Arabic Name"
                      value={formData.name_ar}
                      onChange={handleChange}
                      className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                    />
                    {!editing && (
                      <input
                        type="text"
                        name="key"
                        placeholder="Key (unique identifier)"
                        value={formData.key}
                        onChange={handleChange}
                        className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                      />
                    )}
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                    >
                      <option value="">Select Category</option>
                      <option value="farm">Farm</option>
                      <option value="pet">Pet</option>
                    </select>
                  </div>

                  {/* Image upload panel */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm text-gray-600 dark:text-gray-300">Image (optional)</label>

                    <div className="border border-dashed rounded-lg p-3 flex flex-col items-center justify-center gap-3">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="w-40 h-40 object-cover rounded-md border"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "";
                            setPreviewUrl(null);
                          }}
                        />
                      ) : editing?.imageUrl ? (
                        <img
                          src={editing.imageUrl as string}
                          alt="existing"
                          className="w-40 h-40 object-cover rounded-md border"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "";
                          }}
                        />
                      ) : (
                        <div className="w-40 h-40 rounded-md border bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                          <PhotoIcon className="w-10 h-10 text-gray-400" />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <span className="px-3 py-1 bg-[#4F46E5] text-white rounded-md text-sm">Choose Image</span>
                        </label>

                        {(selectedFile || previewUrl) && (
                          <button
                            onClick={handleRemoveImage}
                            className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        JPG / PNG / WEBP / GIF — max 5MB
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <button
                    onClick={handleCloseDialog}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
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
              setAnimalTypeToDelete(null);
            }}
            title="Delete Animal Type"
            description={`Are you sure you want to delete "${animalTypeToDelete?.name_en}"? This action cannot be undone.`}
            confirmText="Yes, Delete"
            cancelText="Cancel"
            confirmColor="danger"
            onConfirm={() => {
              if (animalTypeToDelete) handleDeleteConfirmed(animalTypeToDelete._id);
            }}
          />

          {/* ---------- BULK UPLOAD INFO + UPLOADER MODAL ---------- */}
          <Modal
            open={bulkModalOpen}
            onClose={() => {
              setBulkModalOpen(false);
              resetBulkUploader();
            }}
            title="Bulk Upload Animal Types (CSV)"
            confirmText="Continue"
            cancelText="Cancel"
            confirmColor="primary"
            // Confirm button will trigger upload; disabled unless file selected
            onConfirm={() => {
              // start upload
              uploadBulkFile();
            }}
          >
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>
                To bulk upload animal types, please provide a CSV file including the mandatory columns:
              </p>

              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
                <li><strong>name_en</strong></li>
                <li><strong>name_ar</strong></li>
                <li><strong>key</strong></li>
                <li><strong>category</strong> (values: <code>farm</code> or <code>pet</code>)</li>
              </ul>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                If any of these columns are missing for a row, that row will be skipped. The server will return a summary and a list of skipped items with reasons.
              </p>

              {/* Uploader area */}
              <div
                onDrop={onDropBulk}
                onDragOver={onDragOver}
                className="mt-3 border border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800"
                style={{ minHeight: 140 }}
              >
                <div className="text-sm text-gray-600 dark:text-gray-300">Drag & drop CSV here</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">or</div>

                <label className="cursor-pointer">
                  <input
                    ref={bulkInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onBulkInputChange}
                    className="hidden"
                  />
                  <span className="px-3 py-1 bg-[#4F46E5] text-white rounded-md text-sm">Choose CSV</span>
                </label>

                {bulkFileName ? (
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    Selected file: <span className="font-medium">{bulkFileName}</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Accepted: .csv — max 10MB
                  </div>
                )}

                {bulkFileError && (
                  <div className="text-sm text-red-500 mt-2">{bulkFileError}</div>
                )}

                <div className="pt-2 w-full flex flex-col gap-2 justify-between">
                  <button
                    onClick={() => {
                      resetBulkUploader();
                    }}
                    className="px-3 py-1 border border-red-500 rounded-md text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Clear
                  </button>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Note: file must contain headers: <code>name_en, name_ar, key, category</code>
                  </div>
                </div>
              </div>

              {/* small help / sample row */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Example row: <code>Goat,ماعز,goat,farm</code>
              </div>

              {/* disable Confirm if no file */}
              <div className="hidden">
                {/* Trick: Modal component shows confirm button always; we'll guard onConfirm by checking bulkFile when clicked.
                    However to visually disable the confirm button we need to allow Modal to take a disabled state --
                    since Modal doesn't accept disabled prop in current shape, we handle gating on upload start (uploadBulkFile checks file). */}
              </div>
            </div>
          </Modal>

          {/* ---------- BULK UPLOAD RESULT MODAL ---------- */}
          <Modal
            open={resultModalOpen}
            onClose={() => {
              setResultModalOpen(false);
              setBulkResult(null);
            }}
            title="Bulk Upload Result"
            cancelText="Close"
            confirmText="OK"
            confirmColor="primary"
            onConfirm={() => {
              // OK just closes
              setResultModalOpen(false);
              setBulkResult(null);
            }}
          >
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
              <div>
                <strong>Message:</strong>{" "}
                <span>{bulkResult?.message ?? "No message provided"}</span>
              </div>

              <div className="flex gap-4">
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

              {/* Skipped list */}
              <div>
                <div className="text-sm font-medium mb-2">Skipped rows</div>
                <div className="max-h-60 overflow-auto border rounded-md p-2 bg-white dark:bg-gray-800">
                  {Array.isArray(bulkResult?.errors) && bulkResult!.errors.length > 0 ? (
                    bulkResult!.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-start gap-2 py-2 border-b last:border-b-0 text-sm"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {err?.key ?? "[no key provided]"}
                          </div>
                          <div className="text-xs text-gray-500">{err?.reason ?? "Unknown reason"}</div>
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
          {/* ---------------------------------------- */}
        </PageWrapper>
      </div>
    </div>
  );
};

export default AnimalTypes;
