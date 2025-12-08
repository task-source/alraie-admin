// src/pages/Gps.tsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { FiSearch } from "react-icons/fi";
import Modal from "../components/Modal";

interface Owner {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface Animal {
  _id?: string;
  uniqueAnimalId?: string;
  name?: string;
  typeNameEn?: string;
  breedNameEn?: string;
  profilePicture?: string | null;
}

interface GpsRow {
  _id: string;
  serialNumber: string;
  ownerId?: string;
  createdBy?: string;
  isLinked?: boolean;
  linkedAt?: string;
  createdAt?: string;
  owner?: Owner | null;
  animal?: Animal | null;
}

/* --- Helper: Image with fallback --- */
const ImageWithFallback: React.FC<{
  src?: string | null;
  alt?: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md border">
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

/* --- Component --- */
const Gps: React.FC = () => {
  const { showApiError, showAlert } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  const [rows, setRows] = useState<GpsRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  // filters
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [debouncedOwnerId, setDebouncedOwnerId] = useState<string>("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [linked, setLinked] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const [gpsToAction, setGpsToAction] = useState<GpsRow | null>(null);
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  /* ---------------------- DEBOUNCE SEARCH ---------------------- */
  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms debounce

    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedOwnerId(ownerId);
    }, 500); // 500ms debounce

    return () => clearTimeout(delay);
  }, [ownerId]);
  /* ---------------------- FETCH GPS ---------------------- */
  const fetchGps = async () => {
    try {
      showLoader();
      const params: any = {
        page,
        limit,
        search: debouncedSearch || undefined,
        ownerId: debouncedOwnerId || undefined,
        linked: linked || undefined,
        sortBy,
        sortOrder,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === "") delete params[k];
      });

      const res = await api.get("/admin/gps", { params });
      if (res?.data?.success) {
        const pagination = res.data.pagination || {};
        setPage(pagination.page || 1);
        setLimit(pagination.limit || limit);
        setTotalPages(pagination.totalPages || 1);
        setRows(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setRows([]);
        setTotalPages(1);
      }
    } catch (err) {
      showApiError(err);
      setRows([]);
      setTotalPages(1);
    } finally {
      hideLoader();
    }
  };

  const handleUnlinkGps = async () => {
    if (!gpsToAction?.serialNumber) return;
    try {
      showLoader();
      const res = await api.post("/gps/unlink", {
        serialNumber: gpsToAction.serialNumber,
      });
      if (res?.data?.success) {
        showAlert("success", "GPS unlinked successfully");
        fetchGps();
      } else {
        showAlert("error", "Failed to unlink GPS");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setUnlinkModalOpen(false);
    }
  };

  const handleDeleteGps = async () => {
    if (!gpsToAction?.serialNumber) return;
    try {
      showLoader();
      const res = await api.post("/gps/delete", {
        serialNumber: gpsToAction.serialNumber,
      });
      if (res?.data?.success) {
        showAlert("success", "GPS deleted successfully");
        fetchGps();
      } else {
        showAlert("error", "Failed to delete GPS");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setDeleteModalOpen(false);
    }
  };

  /* Reset Page When Filters Change */
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    debouncedOwnerId,
    linked,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    limit,
  ]);

  /* Auto Fetch on Changes */
  useEffect(() => {
    fetchGps();
  }, [
    page,
    limit,
    debouncedSearch,
    debouncedOwnerId,
    linked,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  /* -------- Columns -------- */
  const columns: DataTableColumn<GpsRow>[] = [
    {
      key: "serialNumber",
      label: "Serial Number",
      render: (r) => r.serialNumber || "—",
    },
    {
      key: "owner",
      label: "Owner",
      render: (r) =>
        r.owner?.name || r.owner?.email || r.owner?.phone || "Unassigned",
    },
    {
      key: "animal",
      label: "Linked Animal",
      render: (r) =>
        r.animal ? (
          <div className="flex items-center gap-2">
            <ImageWithFallback
              src={r.animal.profilePicture || null}
              alt={r.animal.name}
              className="w-10 h-10 rounded-md object-cover border"
            />
            <div>
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {r.animal.name || "—"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {r.animal.uniqueAnimalId || "—"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {r.animal.typeNameEn || ""}{" "}
                {r.animal.breedNameEn ? `- ${r.animal.breedNameEn}` : ""}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Not linked</span>
        ),
    },
    {
      key: "isLinked",
      label: "Linked?",
      render: (r) => (
        <span
          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
            r.isLinked
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          {r.isLinked ? "Linked" : "Unlinked"}
        </span>
      ),
      className: "text-center",
    },
    {
      key: "linkedAt",
      label: "Linked At",
      render: (r) => (r.linkedAt ? new Date(r.linkedAt).toLocaleString() : "—"),
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
        <div className="flex gap-2">
          {/* UNLINK button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGpsToAction(r);
              setUnlinkModalOpen(true);
            }}
            disabled={!r.isLinked}
            className={`px-2 py-1 rounded text-xs border ${
              r.isLinked
                ? "border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                : "border-gray-400 text-gray-400 cursor-not-allowed"
            }`}
          >
            Unlink
          </button>

          {/* DELETE button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGpsToAction(r);
              setDeleteModalOpen(true);
            }}
            disabled={r.isLinked}
            className={`px-2 py-1 rounded text-xs border ${
              r.isLinked
                ? "border-gray-400 text-gray-400 cursor-not-allowed"
                : "border-red-600 text-red-600 hover:bg-red-50"
            }`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  /* Pagination Buttons */
  const renderPaginationButtons = () => {
    const buttons: React.ReactNode[] = [];
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
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
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
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          {num}
        </button>
      );
    }

    if (endPage < totalPages - 1)
      buttons.push(
        <span key="ellipsis" className="px-2 text-gray-500">
          ...
        </span>
      );

    if (endPage < totalPages)
      buttons.push(
        <button
          key={totalPages}
          onClick={() => setPage(totalPages)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            page === totalPages
              ? "bg-[#4F46E5] text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          {totalPages}
        </button>
      );

    buttons.push(
      <button
        key="next"
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={page === totalPages}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          page === totalPages
            ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        Next
      </button>
    );

    return buttons;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
        <Header />
        <PageWrapper>
          <div className="px-3 sm:px-6 w-full max-w-full overflow-x-hidden">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
              GPS Devices
            </h1>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-4 w-full">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by Serial Number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-10 py-2 focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <FiSearch />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Owner ID"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                />

                <select
                  value={linked}
                  onChange={(e) => setLinked(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                >
                  <option value="">All</option>
                  <option value="true">Linked</option>
                  <option value="false">Unlinked</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center flex-1 gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                  />
                </div>
                <div className="flex items-center flex-1 gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                >
                  <option value="createdAt">Sort by Created At</option>
                  <option value="serialNumber">Sort by Serial</option>
                  <option value="linkedAt">Sort by Linked At</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>

                <button
                  onClick={fetchGps}
                  className="flex-1 bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm"
                >
                  Apply
                </button>
              </div>
            </div>

            <DataTable<GpsRow>
              data={rows}
              columns={columns}
              emptyMessage="No GPS devices found"
            />

            <div className="flex flex-wrap justify-center mt-5 gap-2">
              {renderPaginationButtons()}
            </div>
          </div>
        </PageWrapper>
      </main>
      <Modal
        open={unlinkModalOpen}
        onClose={() => setUnlinkModalOpen(false)}
        title="Unlink GPS?"
        description={`This will unlink GPS device with serial: ${gpsToAction?.serialNumber}. Are you sure?`}
        confirmText="Yes, Unlink"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={handleUnlinkGps}
      />

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete GPS?"
        description={`This will permanently delete GPS device with serial: ${gpsToAction?.serialNumber}. Are you sure?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={handleDeleteGps}
      />
    </div>
  );
};

export default Gps;
