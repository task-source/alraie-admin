// src/pages/DeletedUsers.tsx
import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";

interface DeletedUser {
  _id: string;
  userId: string;
  role: string;
  email: string;
  animalType: string;
  language: string;
  deletionReason: string;
  deletedBy: string;
  deletedAt: string;
}

const DeletedUsers: React.FC = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showApiError } = useAlert();

  const [items, setItems] = useState<DeletedUser[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [role, setRole] = useState("");
  const [animalType, setAnimalType] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState<"date_latest" | "date_oldest">("date_latest");
  const [fromDate, setFromDate] = useState<string>("");
const [toDate, setToDate] = useState<string>("");

  /* ---------------- Debounce search ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------------- Fetch ---------------- */
  const fetchDeletedUsers = useCallback(async () => {
    try {
      showLoader();

      const params: any = {
        page,
        limit,
        sort,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (role) params.role = role;
      if (animalType) params.animalType = animalType;
      if (language) params.language = language;

      if (fromDate) {
        params.fromDate = new Date(fromDate).toISOString();
      }
      
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        params.toDate = end.toISOString();
      }

      const res = await api.get("/admin/deletedUsers", { params });

      if (res.data?.success) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  }, [
    page,
    limit,
    sort,
    debouncedSearch,
    role,
    animalType,
    language,
    fromDate,
    toDate,
  ]);

  /* ---------------- Reset page on filter change ---------------- */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, animalType, language, sort, fromDate, toDate,]);

  useEffect(() => {
    fetchDeletedUsers();
  }, [fetchDeletedUsers]);

  /* ---------------- Table ---------------- */
  const columns: DataTableColumn<DeletedUser>[] = [
    {
      key: "userId",
      label: "User ID",
      render: (u) => u.userId,
    },
    {
      key: "email",
      label: "Email",
      render: (u) => u.email,
    },
    {
      key: "role",
      label: "Role",
      render: (u) => u.role.toUpperCase(),
    },
    {
      key: "animalType",
      label: "Animal Type",
      render: (u) => u.animalType ?? "—",
    },
    {
      key: "language",
      label: "Language",
      render: (u) => u.language?.toUpperCase(),
    },
    {
      key: "reason",
      label: "Deletion Reason",
      render: (u) => u.deletionReason || "—",
    },
    {
      key: "deletedAt",
      label: "Deleted At",
      render: (u) =>
        new Date(u.deletedAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
  ];

  const totalPages = Math.ceil(total / limit);

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
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          page === 1
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
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            page === num
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
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            page === totalPages
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
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          page === totalPages
            ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        Next
      </button>
    );
  
    return buttons;
  };
  
  /* ---------------- Render ---------------- */
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 w-full max-w-full overflow-x-hidden">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-6 dark:text-white">
              Deleted Users
            </h1>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-4">

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search by email, phone, name or deletion reason"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />

                <FilterDropdown
                  label="Role"
                  value={role}
                  onChange={setRole}
                  options={[
                    { label: "All Roles", value: "" },
                    { label: "Owner", value: "owner" },
                    { label: "Assistant", value: "assistant" },
                    { label: "Admin", value: "admin" },
                  ]}
                  className="w-full sm:w-40"
                />

<FilterDropdown
                  label="Animal Type"
                  value={animalType}
                  onChange={setAnimalType}
                  options={[
                    { label: "All", value: "" },
                    { label: "Farm", value: "farm" },
                    { label: "Pet", value: "pet" },
                  ]}
                  className="w-full sm:w-40"
                />
              </div>

<div>
<div className="flex flex-col sm:flex-row gap-3 w-full">
  <input
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
    className="flex-1 border rounded-lg px-3 py-2 text-sm w-full sm:w-48 
      dark:border-gray-700 dark:bg-gray-800 dark:text-white"
  />

  <input
    type="date"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    className="flex-1 border rounded-lg px-3 py-2 text-sm w-full sm:w-48 
      dark:border-gray-700 dark:bg-gray-800 dark:text-white"
  />
  <button
  onClick={() => {
    setFromDate("");
    setToDate("");
  }}
  className="text-sm text-gray-600 dark:text-white underline"
>
  Clear dates
</button>
</div>

</div>
            </div>

            {/* Table */}
            <DataTable<DeletedUser>
              data={items}
              columns={columns}
              emptyMessage="No deleted users found"
            />

            {/* Pagination */}
            <div className="flex flex-wrap justify-center mt-5 gap-2">
              {renderPaginationButtons()}
            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
};

export default DeletedUsers;
