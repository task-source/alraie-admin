import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { FiSearch } from "react-icons/fi";
import Modal from "../components/Modal";

interface UserShort {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface SampleAnimal {
  _id: string;
  uniqueAnimalId?: string;
  profilePicture?: string | null;
  name?: string;
  gender?: string;
}

interface GeofenceRow {
  _id: string;
  name?: string;
  center?: { lat?: number; lng?: number } | null;
  radiusKm?: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: UserShort | null;
  creator?: UserShort | null;
  animalCount?: number;
  sampleAnimals?: SampleAnimal[];
}

/* --- Small helper: Image with fallback using internal state --- */
const ImageWithFallback: React.FC<{
  src?: string | null;
  alt?: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // reset when src changes
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <PhotoIcon className={`${className ?? "w-12 h-12"} text-gray-400`} />
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/img-redundant-alt
    <img
      src={src}
      alt={alt || "image"}
      className={className ?? "w-12 h-12 rounded-md object-cover border"}
      onError={() => setFailed(true)}
    />
  );
};

/* --- Component --- */
const Geofences: React.FC = () => {
  const { showApiError, showAlert } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  const [rows, setRows] = useState<GeofenceRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [debouncedOwnerID, setDebouncedOwnerID] = useState<string>("");
  const [debouncedCreatedBy, setDebouncedCreatedBy] = useState<string>("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [createdBy, setCreatedBy] = useState<string>("");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [sortBy, setSortBy] = useState<string>("createdAt"); // default sort
  const [sortOrder, setSortOrder] = useState<string>("desc");

  // Modal state for viewing animals
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalAnimals, setModalAnimals] = useState<SampleAnimal[]>([]);
  const [modalTitle, setModalTitle] = useState<string>("");

  const [geofenceToDelete, setGeofenceToDelete] = useState<GeofenceRow | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  /* ---------------------- DEBOUNCING SEARCH ---------------------- */
  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedOwnerID(ownerId);
    }, 500);

    return () => clearTimeout(delay);
  }, [ownerId]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedCreatedBy(createdBy);
    }, 500);

    return () => clearTimeout(delay);
  }, [createdBy]);
  /* ---------------------- FETCH GEOFENCES ---------------------- */

  const fetchGeofences = async () => {
    try {
      showLoader();
      const params: any = {
        page,
        limit,
        search: debouncedSearch || null,
        ownerId: debouncedOwnerID || null,
        createdBy: debouncedCreatedBy || null,
        startDate: startDate || null,
        endDate: endDate || null,
        sortBy: sortBy || null,
        sortOrder: sortOrder || null,
      };

      // remove nulls to keep query clean
      Object.keys(params).forEach((k) => {
        if (params[k] === null || params[k] === "") delete params[k];
      });

      const res = await api.get("/admin/geofences", { params });
      if (res?.data?.success) {
        const pagination = res.data.pagination || {};
        setPage(pagination.page || 1);
        setLimit(pagination.limit || limit);
        setTotalPages(pagination.totalPages || 1);
        setRows(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setRows([]);
        setTotalPages(1);
        setPage(1);
      }
    } catch (err) {
      showApiError(err);
      setRows([]);
      setTotalPages(1);
      setPage(1);
    } finally {
      hideLoader();
    }
  };

  const handleDeleteGeofence = async () => {
    if (!geofenceToDelete?._id) return;
    try {
      showLoader();
      const res = await api.delete(`/geofence/${geofenceToDelete._id}`);

      if (res?.data?.success) {
        showAlert("success", "Geofence deleted");
        fetchGeofences();
      } else {
        showAlert("error", "Delete failed");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setDeleteModalOpen(false);
      setGeofenceToDelete(null);
    }
  };
  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    debouncedOwnerID,
    debouncedCreatedBy,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    limit,
  ]);

  // initial fetch & on page/limit/filter changes
  useEffect(() => {
    fetchGeofences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    limit,
    debouncedSearch,
    debouncedOwnerID,
    debouncedCreatedBy,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  // DataTable columns (uses your DataTable component shape)
  const columns: DataTableColumn<GeofenceRow>[] = [
    {
      key: "name",
      label: "Name",
      render: (r) => r.name || "—",
    },
    {
      key: "owner",
      label: "Owner",
      render: (r) => r.owner?.name || r.owner?.email || r.owner?.phone || "N/A",
    },
    {
      key: "creator",
      label: "Created By",
      render: (r) => r.creator?.name || r.creator?.email || "N/A",
    },
    {
      key: "center",
      label: "Center (lat / lng)",
      render: (r) =>
        r.center && r.center.lat !== undefined && r.center.lng !== undefined
          ? `${r.center.lat}, ${r.center.lng}`
          : "N/A",
    },
    {
      key: "radiusKm",
      label: "Radius (km)",
      render: (r) => (typeof r.radiusKm === "number" ? r.radiusKm : "N/A"),
    },
    {
      key: "animalCount",
      label: "Animals",
      render: (r) => (typeof r.animalCount === "number" ? r.animalCount : 0),
    },
    {
      key: "view_animals",
      label: "View Animals",
      render: (r) => (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setModalAnimals(
                Array.isArray(r.sampleAnimals) ? r.sampleAnimals : []
              );
              setModalTitle(r.name || "Sample Animals");
              setModalOpen(true);
            }}
            className="px-3 py-1 rounded-md text-sm font-medium bg-[#4F46E5] text-white hover:bg-[#0000CC] transition"
          >
            View Animals
          </button>
        </div>
      ),
      className: "text-right",
    },
    {
      key: "createdAt",
      label: "Created At (UTC)",
      render: (r) =>
        r.createdAt
          ? new Date(r.createdAt).toLocaleString(undefined, { timeZone: "UTC" })
          : "N/A",
    },
    {
      key: "delete",
      label: "Actions",
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setGeofenceToDelete(r);
            setDeleteModalOpen(true);
          }}
          className="px-3 py-1 rounded-md text-xs border border-red-600 text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      ),
    },
  ];

  // Pagination helpers (same 3-box window + prev/next + ellipsis)
  const renderPaginationButtons = () => {
    const buttons: React.ReactNode[] = [];
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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 w-full max-w-full overflow-x-hidden">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
              Geofences
            </h1>

            {/* Filters */}
            <div className="flex flex-col md:items-center gap-3 mb-4 w-full">
              <div className="flex gap-3 flex-col sm:flex-row w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search geofences..."
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
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                />

                <input
                  type="text"
                  placeholder="Created By ID"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                <div className="flex flex-1 flex-row items-center w-full">
                  <label className="text-sm text-gray-600 dark:text-gray-300 mr-2">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-1 flex-row items-center w-full">
                  <label className="text-sm text-gray-600 dark:text-gray-300 mr-2 ml-2">
                    To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center w-full">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                >
                  <option value="createdAt">Sort by Created At</option>
                  <option value="name">Sort by Name</option>
                  <option value="animalCount">Sort by Animal Count</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>

                <button
                  onClick={() => fetchGeofences()}
                  className="flex-1 bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm w-full transition"
                >
                  Apply
                </button>
              </div>
            </div>

            <DataTable<GeofenceRow>
              data={rows}
              columns={columns}
              onRowClick={() => {}}
              emptyMessage="No geofences found"
            />

            {/* Pagination */}
            <div className="flex flex-wrap justify-center mt-5 gap-2">
              {renderPaginationButtons()}
            </div>
          </div>
        </PageWrapper>
      </main>

      {/* Modal: View Animals */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3"
          onMouseDown={(e) => {
            // close when clicking outside modal box
            if ((e.target as HTMLElement).classList.contains("fixed")) {
              setModalOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-4xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalTitle}
              </h2>
              <div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  Close
                </button>
              </div>
            </div>

            {modalAnimals.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No animals to show
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {modalAnimals.map((a) => (
                  <div
                    key={a._id}
                    className="flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="w-28 h-28 flex items-center justify-center rounded-md overflow-hidden bg-white dark:bg-gray-800">
                      <ImageWithFallback
                        src={a.profilePicture || null}
                        alt={a.name || a.uniqueAnimalId || "animal"}
                        className="w-28 h-28 object-cover"
                      />
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                      {a.name || "—"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {a.uniqueAnimalId || "—"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {a.gender || "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Geofence?"
        description={
          geofenceToDelete?.name
            ? `This will permanently delete geofence "${geofenceToDelete.name}". Are you sure?`
            : "This will permanently delete geofence. Are you sure?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={() => {
          setDeleteModalOpen(false);
          handleDeleteGeofence();
        }}
      />
    </div>
  );
};

export default Geofences;
