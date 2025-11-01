import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";

interface AnimalType {
  _id: string;
  name_en: string;
  name_ar: string;
  key: string;
  category: "farm" | "pet";
  createdAt: string;
}

const AnimalTypes: React.FC = () => {
  const { showAlert, showApiError } = useAlert();
  const { showLoader, hideLoader } = useLoader();
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [category, setCategory] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editing, setEditing] = useState<AnimalType | null>(null);
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    key: "",
    category: "",
  });

  // Fetch Animal Types
  const fetchAnimalTypes = async () => {
    try {
      showLoader();
      const params: any = {};
      if (category && category !== "all") params.category = category;

      const res = await api.get("/admin/animalType", { params });
      if (res.data.success) setAnimalTypes(res.data.data);
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchAnimalTypes();
  }, [category]);

  const handleOpenDialog = (animal?: AnimalType) => {
    if (animal) {
      setEditing(animal);
      setFormData({
        name_en: animal.name_en,
        name_ar: animal.name_ar,
        key: animal.key,
        category: animal.category,
      });
    } else {
      setEditing(null);
      setFormData({ name_en: "", name_ar: "", key: "", category: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      showLoader();
      if (editing) {
        await api.put(`/admin/animalType/${editing._id}`, formData);
      } else {
        await api.post("/admin/animalType", formData);
      }
      handleCloseDialog();
      fetchAnimalTypes();
      showAlert("success", "Animal type saved successfully");
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this animal type?"))
      return;
    try {
      showLoader();
      await api.delete(`/admin/animalType/${id}`);
      fetchAnimalTypes();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const columns: DataTableColumn<AnimalType>[] = [
    {
      key: "name_en",
      label: "English Name",
      render: (a) => a.name_en,
    },
    {
      key: "name_ar",
      label: "Arabic Name",
      render: (a) => a.name_ar,
    },
    {
      key: "key",
      label: "Key",
      render: (a) => a.key,
    },
    {
      key: "category",
      label: "Category",
      render: (a) => (
        <span className="capitalize text-gray-800 dark:text-gray-200">
          {a.category}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (a) =>
        new Date(a.createdAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
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
            onClick={() => handleDelete(a._id)}
            className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg px-3 py-1 text-sm transition"
          >
            Delete
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <PageWrapper>
          <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
            Animal Types
          </h1>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4 w-full">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full sm:w-48 focus:ring-2 focus:ring-[#4F46E5] outline-none"
            >
              <option value="">All Categories</option>
              <option value="farm">Farm</option>
              <option value="pet">Pet</option>
            </select>

            <button
              onClick={() => handleOpenDialog()}
              className="bg-[#4F46E5] hover:bg-[#0000CC] text-white text-sm font-medium rounded-lg px-4 py-2 transition-all w-full sm:w-auto"
            >
              + Add Animal Type
            </button>
          </div>

          <DataTable<AnimalType>
            data={animalTypes}
            columns={columns}
            emptyMessage="No animal types found"
          />

          {openDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  {editing ? "Edit Animal Type" : "Add Animal Type"}
                </h2>

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
                      placeholder="Key"
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
        </PageWrapper>
      </div>
    </div>
  );
};

export default AnimalTypes;
