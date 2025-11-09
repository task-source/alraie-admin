// src/pages/Animals.tsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { FiSearch } from "react-icons/fi";
import { PhotoIcon } from "@heroicons/react/24/outline";
interface AnimalOwner {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface AnimalAssistant {
  _id?: string;
  name?: string;
  email?: string;
}

interface AnimalRow {
  _id: string;
  uniqueAnimalId?: string;
  name?: string;
  typeNameEn?: string | null;
  typeNameAr?: string | null;
  category?: string;
  animalStatus?: string;
  gender?: string;
  dob?: string | null;
  tagId?: string;
  breed?: string;
  country?: string;
  profilePicture?: string | null;
  hasVaccinated?: boolean;
  createdAt?: string;
  updatedAt?: string;
  owner?: AnimalOwner | null;
  assistant?: AnimalAssistant | null;
}

interface AnimalTypeOption {
  _id: string;
  name_en?: string | null;
  key: string;
  category: "farm" | "pet";
}

const FALLBACK_IMG = <PhotoIcon className="w-16 h-16 text-gray-400" />; 

const Animals: React.FC = () => {
  const { showApiError } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [typeId, setTypeId] = useState<string>("");
  const [gender, setGender] = useState<string>("");


  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");


  const [typeOptions, setTypeOptions] = useState<AnimalTypeOption[]>([]);


  const [sortBy,] = useState<string>("");


  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 👈 debounce 500ms
    return () => clearTimeout(delay);
  }, [search]);

  const fetchAnimalTypes = async () => {
    try {
      const res = await api.get("/admin/animalType", {
        params: { lang: "en" },
      });
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setTypeOptions(res.data.data);
      } else {
        setTypeOptions([]);
      }
    } catch (err) {

      showApiError(err);
      setTypeOptions([]);
    }
  };

  const fetchAnimals = async () => {
    try {
      showLoader();
      const params: any = {
        page,
        limit,
        search: debouncedSearch,
      };
      if (status) params.status = status;
      if (category) params.category = category;
      if (typeId) params.typeId = typeId;
      if (gender) params.gender = gender;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get("/admin/animals", { params });
      if (res?.data?.success) {
        // response shape we saw: { pagination: { page, limit, total, totalPages }, data: [] }
        const pagination = res.data.pagination || {};
        setPage(pagination.page || 1);
        setLimit(pagination.limit || limit);
        setTotalPages(pagination.totalPages || 1);
        setAnimals(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setAnimals([]);
      }
    } catch (err) {
      showApiError(err);
      setAnimals([]);
    } finally {
      hideLoader();
    }
  };

  // reset page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, category, typeId, gender, startDate, endDate, limit]);

  // initial fetch for types + data
  useEffect(() => {
    fetchAnimalTypes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once

  // fetch animals when page, limit or filters change
  useEffect(() => {
    fetchAnimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    limit,
    debouncedSearch,
    status,
    category,
    typeId,
    gender,
    startDate,
    endDate,
    sortBy,
  ]);

  // Columns for DataTable
  const columns: DataTableColumn<AnimalRow>[] = [
    {
      key: "profilePicture",
      label: "Photo",
      render: (r) => {
        let src = r?.profilePicture;
        return (
          <div className="flex items-center gap-3">
            {!!src ? (
              <img
                src={src}
                alt={r.name || r.uniqueAnimalId || "animal"}
                onError={(e: any) => {
                  if (e?.currentTarget?.src !== FALLBACK_IMG) {
                   src = null
                  }
                }}
                className="w-12 h-12 rounded-md object-cover border"
              />
            ) : (
              <PhotoIcon className="w-12 h-12 text-gray-400" />
            )}
          </div>
        );
      },
    },
    {
      key: "uniqueAnimalId",
      label: "ID / Name",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
            {r.name || "—"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {r.uniqueAnimalId || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (r) => r.typeNameEn || r.typeNameAr || r?.category || "N/A",
    },
    {
      key: "category",
      label: "Category",
      render: (r) => (r.category ? r.category.toUpperCase() : "N/A"),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => r.animalStatus || "N/A",
    },
    {
      key: "gender",
      label: "Gender",
      render: (r) => r.gender || "N/A",
    },
    {
      key: "vaccinated",
      label: "Vaccinated",
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded-md font-medium ${
            r.hasVaccinated
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {r.hasVaccinated ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      render: (r) => r.owner?.name || r.owner?.email || r.owner?.phone || "N/A",
    },
    {
      key: "assistant",
      label: "Created By",
      render: (r) => r.assistant?.name || r.assistant?.email || "N/A",
    },
    {
      key: "createdAt",
      label: "Created At (UTC)",
      render: (r) =>
        r.createdAt
          ? // show UTC date/time so server date isn't shifted by client TZ
            new Date(r.createdAt).toLocaleString(undefined, { timeZone: "UTC" })
          : "N/A",
    },
  ];

  // Pagination helpers for rendering 3-box window with ellipsis and prev/next
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
              Animals
            </h1>

            {/* Filters row: search + type + other small filters */}
            <div className="flex flex-col md:items-center gap-3 mb-4 w-full">
              <div className="flex gap-3 flex-col sm:flex-row w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search animals by name / ID / tag..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-10 py-2 focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <FiSearch />
                  </div>
                </div>
                <select
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                >
                  <option value="">All Types</option>
                  {typeOptions.map((t) => (
                    <option key={t._id} value={t._id}>
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

              {/* Date range row */}
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
                <div className="flex flex-1 flex-row items-center  w-full">
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

              {/* right side small filters */}
              <div className="flex flex-1 flex-col sm:flex-row gap-3 items-center w-full">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="dead">Dead</option>
                  <option value="transferred">Transferred</option>
                </select>

                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                >
                  <option value="">Any Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>

                <button
                  onClick={() => fetchAnimals()}
                  className="flex-1 bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm w-full transition"
                >
                  Apply
                </button>
              </div>
            </div>
            <DataTable<AnimalRow>
              data={animals}
              columns={columns}
              onRowClick={(row) => {
                // Example row click - navigate or open detail modal
              }}
              emptyMessage="No animals found"
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

export default Animals;
