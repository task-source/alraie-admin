import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import { PhotoIcon } from "@heroicons/react/24/outline";

interface Slide {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const Slides: React.FC = () => {
  const { showAlert, showApiError } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  const [slides, setSlides] = useState<Slide[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editing, setEditing] = useState<Slide | null>(null);

  const [form, setForm] = useState({ title: "", description: "" });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [slideToDelete, setSlideToDelete] = useState<Slide | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const fetchSlides = async () => {
    try {
      showLoader();
      const res = await api.get("/admin/slide/allSlides");
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setSlides(res.data.data);
      } else setSlides([]);
    } catch (err) {
      showApiError(err);
      setSlides([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const openCreateDialog = () => {
    setEditing(null);
    setForm({ title: "", description: "" });
    setSelectedFile(null);
    setPreviewUrl(null);
    setOpenDialog(true);
  };

  const openEditDialog = (s: Slide) => {
    setEditing(s);
    setForm({ title: s.title || "", description: s.description || "" });
    setSelectedFile(null);
    setPreviewUrl(s.imageUrl ?? null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setOpenDialog(false);
    setEditing(null);
    setForm({ title: "", description: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateAndSetFile = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return true;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      showAlert("error", "Only JPG, PNG, WEBP, or GIF images are allowed.");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showAlert("error", "Image too large. Max allowed size is 5 MB.");
      return false;
    }
    const url = URL.createObjectURL(file);
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
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    if (!form.title?.trim()) {
      showAlert("error", "Title is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      showLoader();
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description || "");
      if (selectedFile) fd.append("image", selectedFile);

      if (editing) {
        await api.put(`/admin/slide/${editing._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("success", "Slide updated successfully");
      } else {
        await api.post("/admin/slide", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("success", "Slide created successfully");
      }

      fetchSlides();
      handleCloseDialog();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const handleDeleteConfirmed = async (id: string) => {
    try {
      showLoader();
      await api.delete(`/admin/slide/${id}`);
      showAlert("success", "Slide deleted");
      fetchSlides();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setConfirmOpen(false);
      setSlideToDelete(null);
    }
  };

  const toggleActive = async (s: Slide) => {
    
    setToggleLoading(s._id);
    try {
      const fd = new FormData();
      fd.append("isActive", String(!s.isActive));

      await api.put(`/admin/slide/${s._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSlides((prev) =>
        prev.map((x) => (x._id === s._id ? { ...x, isActive: !x.isActive } : x))
      );
      showAlert("success", "Slide status updated");
    } catch (err) {
      showApiError(err);
    } finally {
      setToggleLoading(null);
    }
  };

  /* -------------------- Columns -------------------- */

  const columns: DataTableColumn<Slide>[] = [
    {
      key: "image",
      label: "Image",
      render: (s) => (
        <img
          src={s.imageUrl || ""}
          alt={s.title || ""}
          onError={(e) => ((e.currentTarget.src = ""), null)}
          className="w-28 h-20 rounded-md object-cover border"
        />
      ),
    },
    {
      key: "title",
      label: "Title",
      render: (s) => s.title || "—",
    },
    {
      key: "description",
      label: "Description",
      render: (s) => s.description || "—",
    },
    {
      key: "isActive",
      label: "Active",
      render: (s) => (
        <button
          disabled={toggleLoading === s._id}
          onClick={() => toggleActive(s)}
          className={`relative w-12 h-6 flex items-center rounded-full transition-all ${
            s.isActive ? "bg-green-500" : "bg-gray-400"
          } ${toggleLoading === s._id ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
        >
          <span
            className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
              s.isActive ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      ),
      className: "text-center",
    },
    {
      key: "actions",
      label: "Actions",
      render: (s) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openEditDialog(s)}
            className="border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white rounded-lg px-3 py-1 text-sm transition"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setSlideToDelete(s);
              setConfirmOpen(true);
            }}
            className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg px-3 py-1 text-sm transition"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  /* -------------------- Render -------------------- */

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
        <Header />
        <PageWrapper>
          <div className="w-full max-w-full overflow-x-hidden">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
              Slides
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 w-full">
              <div className="flex-1" />
              <button
                onClick={openCreateDialog}
                className="bg-[#4F46E5] hover:bg-[#0000CC] text-white text-sm font-medium rounded-lg px-4 py-2 transition-all w-full sm:w-auto"
              >
                + Add Slide
              </button>
            </div>

            <DataTable<Slide> data={slides} columns={columns} emptyMessage="No slides found" />
          </div>
        </PageWrapper>

        {/* Modal: Add/Edit Slide */}
        {openDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                {editing ? "Edit Slide" : "Add Slide"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="Title"
                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                  />
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange as any}
                    placeholder="Description (optional)"
                    rows={5}
                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none resize-none"
                  />
                </div>

                {/* Larger image area */}
                <div className="flex flex-col gap-3">
                  <label className="text-sm text-gray-600 dark:text-gray-300">Background Image</label>

                  <div className="border border-dashed rounded-lg p-3 flex flex-col items-center justify-center gap-3">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="w-full h-64 object-cover rounded-md border"
                        onError={() => setPreviewUrl(null)}
                      />
                    ) : editing?.imageUrl ? (
                      <img
                        src={editing.imageUrl}
                        alt="existing"
                        className="w-full h-64 object-cover rounded-md border"
                        onError={() => setPreviewUrl(null)}
                      />
                    ) : (
                      <div className="w-full h-64 rounded-md border bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                        <PhotoIcon className="w-14 h-14 text-gray-400" />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <span className="px-3 py-1 bg-[#4F46E5] text-white rounded-md text-sm">
                          Choose Image
                        </span>
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
                      JPG / PNG / WEBP / GIF — Max 5MB
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

        {/* Delete Confirmation */}
        <Modal
          open={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setSlideToDelete(null);
          }}
          title="Delete Slide"
          description={`Are you sure you want to delete "${slideToDelete?.title}"? This action cannot be undone.`}
          confirmText="Yes, Delete"
          cancelText="Cancel"
          confirmColor="danger"
          onConfirm={() => {
            if (slideToDelete) handleDeleteConfirmed(slideToDelete._id);
          }}
        />
      </main>
    </div>
  );
};

export default Slides;
