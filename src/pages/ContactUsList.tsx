import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import FilterDropdown from "../components/FilterDropdown";

interface ContactUsRow {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  message: string;
  createdAt: string;
}

const ContactUsList: React.FC = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showApiError } = useAlert();

  const [items, setItems] = useState<ContactUsRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sort, setSort] = useState("date_latest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ---------------- Debounce search ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------------- Fetch ---------------- */
  const fetchContactUs = useCallback(async () => {
    try {
      showLoader();

      const params: any = {
        page,
        limit,
        sort,
      };

      if (debouncedSearch) params.search = debouncedSearch;

      if (fromDate) {
        params.fromDate = new Date(fromDate).toISOString();
      }

      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        params.toDate = end.toISOString();
      }

      const res = await api.get("/contactUs/admin", { params });

      if (res.data?.success) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  }, [page, limit, sort, debouncedSearch, fromDate, toDate]);

  /* ---------------- Reset page on filter change ---------------- */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort, fromDate, toDate]);

  useEffect(() => {
    fetchContactUs();
  }, [fetchContactUs]);

  const totalPages = Math.ceil(total / limit);

  /* ---------------- Pagination (same as others) ---------------- */
  const renderPaginationButtons = () => {
    const buttons = [];
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

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

  /* ---------------- Table ---------------- */
  const columns: DataTableColumn<ContactUsRow>[] = [
    { key: "name", label: "Name", render: (r) => r.name || "—" },
    { key: "email", label: "Email", render: (r) => r.email || "—" },
    { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
    { key: "message", label: "Message", render: (r) => r.message },
    {
      key: "createdAt",
      label: "Submitted At",
      render: (r) =>
        new Date(r.createdAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
  ];

  /* ---------------- Render ---------------- */
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 w-full max-w-full overflow-x-hidden">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-6 dark:text-white">
              Contact Us Requests
            </h1>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search name, email, phone or message"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />

                <FilterDropdown
                  label="Sort"
                  value={sort}
                  onChange={setSort}
                  options={[
                    { label: "Newest First", value: "date_latest" },
                    { label: "Oldest First", value: "date_oldest" },
                    { label: "Name A–Z", value: "name_asc" },
                    { label: "Name Z–A", value: "name_desc" },
                    { label: "Email A–Z", value: "email_asc" },
                    { label: "Email Z–A", value: "email_desc" },
                  ]}
                  className="w-full sm:w-48"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />

                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="text-sm underline dark:text-white"
                >
                  Clear dates
                </button>
              </div>
            </div>

            <DataTable<ContactUsRow>
              data={items}
              columns={columns}
              emptyMessage="No contact requests found"
            />

            <div className="flex flex-wrap justify-center mt-5 gap-2">
              {renderPaginationButtons()}
            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
};

export default ContactUsList;
