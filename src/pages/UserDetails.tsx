import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { PhotoIcon } from "@heroicons/react/24/outline";
import Modal from "../components/Modal";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */
interface User {
  _id: string | undefined;
  name: string | undefined;
  email: string | undefined;
  role: string | undefined;
  createdAt: string | undefined;
  phone: string | undefined;
}

interface UserDetails {
  _id: string;
  email: string;
  role: "owner" | "assistant" | string;
  animalType?: string;
  language?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  ownerId?: string | null;
  assistantIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  gender?: string | null;
  name?: string | null;
  phone?: string | null;
  fullPhone?: string | null;
  countryCode?: string | null;
}

interface AnimalRow {
  _id: string;
  uniqueAnimalId?: string;
  name?: string;
  gender?: string;
  animalStatus?: "active" | "sold" | "dead" | "transferred" | string;
  typeKey?: string;
  typeNameEn?: string;
  breedKey?: string;
  breedNameEn?: string;
  hasVaccinated?: boolean;
  profilePicture?: string;
  createdAt?: string;
}

interface BreedOption {
  _id: string;
  key: string;
  name_en?: string;
}

interface GeofenceRow {
  _id: string;
  name?: string;
  ownerId?: string;
  city?: string;
  country?: string;
  address?: string;
  radiusKm?: number;
  animals?: AnimalRow[];
  createdAt?: string;
  updatedAt?: string;
}

interface GPSRow {
  _id: string;
  serialNumber?: string;
  ownerId?: string;
  createdAt?: string;
  linkedAt?: string | null;
  isLinked?: boolean;
  owner?: {
    _id?: string;
    email?: string;
    name?: string;
    phone?: string;
  };
  animal?: {
    _id?: string;
    typeNameEn?: string;
    breedNameEn?: string;
    uniqueAnimalId?: string;
    name?: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                             IMAGE FALLBACK                                 */
/* -------------------------------------------------------------------------- */

const ImageWithFallback: React.FC<{
  src?: string;
  alt?: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-12 h-12 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <PhotoIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || "image"}
      onError={() => setFailed(true)}
      className={
        className ??
        "w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-gray-700"
      }
    />
  );
};

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

const UserDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { showApiError, showAlert } = useAlert();

  const [user, setUser] = useState<UserDetails | null>(null);

  /* ------------------------- ANIMALS STATE ------------------------- */

  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [animalsPage, setAnimalsPage] = useState<number>(1);
  const [animalsLimit, setAnimalsLimit] = useState<number>(10);
  const [animalsTotalPages, setAnimalsTotalPages] = useState<number>(1);

  const [animalsTotal, setAnimalsTotal] = useState<number>(0);
  const [totalMale, setTotalMale] = useState<number>(0);
  const [totalFemale, setTotalFemale] = useState<number>(0);
  const [totalUnknown, setTotalUnknown] = useState<number>(0);

  /* ------------------------- FILTER STATE ------------------------- */

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [status, setStatus] = useState<string>("");
  const [typeKey, setTypeKey] = useState<string>("");
  const [hasVaccinated, setHasVaccinated] = useState<string>("");

  const [genderFilter, setGenderFilter] = useState<string[]>([]);
  const [breedFilter, setBreedFilter] = useState<string[]>([]);

  const [fromAge, setFromAge] = useState<string>("");
  const [toAge, setToAge] = useState<string>("");

  const [sort, setSort] = useState<string>("name_asc");

  const [breedOptions, setBreedOptions] = useState<BreedOption[]>([]);

  const [geofences, setGeofences] = useState<GeofenceRow[]>([]);
  const [geofencePage, setGeofencePage] = useState<number>(1);
  const [geofenceLimit] = useState<number>(10);
  const [geofenceTotalPages, setGeofenceTotalPages] = useState<number>(1);

  const [geofenceSearch, setGeofenceSearch] = useState<string>("");
  const [debouncedGeofenceSearch, setDebouncedGeofenceSearch] =
    useState<string>("");

  const [isAnimalsModalOpen, setIsAnimalsModalOpen] = useState<boolean>(false);
  const [selectedGeofenceAnimals, setSelectedGeofenceAnimals] = useState<
    AnimalRow[]
  >([]);

  /* ------------------------- GPS STATE ------------------------- */
  const [gpsList, setGpsList] = useState<GPSRow[]>([]);
  const [gpsPage, setGpsPage] = useState<number>(1);
  const [gpsLimit] = useState<number>(10);
  const [gpsTotalPages, setGpsTotalPages] = useState<number>(1);

  const [gpsSearch, setGpsSearch] = useState<string>("");
  const [debouncedGpsSearch, setDebouncedGpsSearch] = useState<string>("");

  const [gpsLinked, setGpsLinked] = useState<string>(""); // "", "true", "false"
  const [gpsSortBy, setGpsSortBy] = useState<string>(""); // "serialNumber", "createdAt", "linkedAt"
  const [gpsSortOrder, setGpsSortOrder] = useState<string>(""); // "asc", "desc"
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [assistants, setAssistants] = useState<User[]>([]);
  const [assistantsPage, setAssistantsPage] = useState<number>(1);
  const [assistantsTotalPages, setAssistantsTotalPages] = useState<number>(1);
  const [assistantsSearch, setAssistantsSearch] = useState<string>("");
  const [debouncedAssistantsSearch, setDebouncedAssistantsSearch] =
    useState<string>("");

  const [assistantToDelete, setAssistantToDelete] = useState<User | null>(null);
  const [assistantDeleteModalOpen, setAssistantDeleteModalOpen] =
    useState(false);

  const [animalToDelete, setAnimalToDelete] = useState<AnimalRow | null>(null);
  const [animalDeleteModalOpen, setAnimalDeleteModalOpen] = useState(false);

  const [gpsToAction, setGpsToAction] = useState<GPSRow | null>(null);
  const [gpsUnlinkModalOpen, setGpsUnlinkModalOpen] = useState(false);
  const [gpsDeleteModalOpen, setGpsDeleteModalOpen] = useState(false);

  // Geofence modals
  const [geofenceToDelete, setGeofenceToDelete] = useState<GeofenceRow | null>(
    null
  );
  const [geofenceDeleteModalOpen, setGeofenceDeleteModalOpen] = useState(false);
  /* -------------------------------------------------------------------------- */
  /*                             LOAD USER DETAILS                               */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        showLoader();
        const res = await api.get(`/admin/user/${id}`);
        if (res?.data?.success && res.data.data?.user) {
          setUser(res.data.data.user);
        } else {
          showAlert("error", "User not found");
          navigate("/users");
        }
      } catch (err) {
        showApiError(err);
        navigate("/users");
      } finally {
        hideLoader();
      }
    };

    fetchUser();
  }, [id]);

  /* -------------------------------------------------------------------------- */
  /*                            LOAD BREEDS FOR FILTER                           */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        showLoader();
        const res = await api.get("/admin/breed", {
          params: { lang: "en", limit: 1000 },
        });
        if (res?.data?.success && Array.isArray(res.data.data)) {
          setBreedOptions(res.data.data);
        }
      } catch (err) {
        showApiError(err);
      } finally {
        hideLoader();
      }
    };
    fetchBreeds();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                               DEBOUNCE SEARCH                              */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedGeofenceSearch(geofenceSearch), 500);
    return () => clearTimeout(t);
  }, [geofenceSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedGpsSearch(gpsSearch), 500);
    return () => clearTimeout(t);
  }, [gpsSearch]);

  useEffect(() => {
    const h = setTimeout(
      () => setDebouncedAssistantsSearch(assistantsSearch),
      500
    );
    return () => clearTimeout(h);
  }, [assistantsSearch]);
  /* -------------------------------------------------------------------------- */
  /*                           OWNER ID FOR ANIMALS                              */
  /* -------------------------------------------------------------------------- */

  const ownerIdForUser: string | null = useMemo(() => {
    if (!user) return null;
    if (user.role === "assistant") {
      return user.ownerId || null;
    }
    return user._id;
  }, [user]);
  /* -------------------------------------------------------------------------- */
  /*                                FETCH ANIMALS                                */
  /* -------------------------------------------------------------------------- */

  const fetchAnimals = async () => {
    if (!ownerIdForUser) return;

    try {
      showLoader();

      const params: any = {
        ownerId: ownerIdForUser,
        page: animalsPage,
        limit: animalsLimit,
        search: debouncedSearch || undefined,
        status: status || undefined,
        typeKey: typeKey || undefined,
        hasVaccinated: hasVaccinated === "" ? undefined : hasVaccinated,
        gender: genderFilter.length ? genderFilter.join(",") : undefined,
        breedKey: breedFilter.length ? breedFilter.join(",") : undefined,
        fromAge: fromAge || undefined,
        toAge: toAge || undefined,
        sort: sort || undefined,
      };

      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === "" || params[k] === null) {
          delete params[k];
        }
      });

      const res = await api.get("/animals", { params });
      const data = res?.data ?? {};

      const items = Array.isArray(data.items) ? data.items : [];

      setAnimals(items);
      setAnimalsTotal(data.total ?? 0);
      setTotalMale(data.totalMale ?? 0);
      setTotalFemale(data.totalFemale ?? 0);
      setTotalUnknown(data.totalUnknown ?? 0);

      setAnimalsTotalPages(Math.ceil((data.total ?? 0) / animalsLimit));
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                          RESET PAGE ON FILTER CHANGE                        */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    setAnimalsPage(1);
  }, [
    debouncedSearch,
    status,
    typeKey,
    hasVaccinated,
    genderFilter,
    breedFilter,
    fromAge,
    toAge,
    sort,
    animalsLimit,
  ]);

  /* -------------------------------------------------------------------------- */
  /*                 FETCH ANIMALS WHEN PAGE / FILTER READY                      */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!ownerIdForUser) return;
    fetchAnimals();
  }, [
    ownerIdForUser,
    animalsPage,
    animalsLimit,
    debouncedSearch,
    status,
    typeKey,
    hasVaccinated,
    genderFilter,
    breedFilter,
    fromAge,
    toAge,
    sort,
  ]);

  const fetchGeofences = async () => {
    if (!ownerIdForUser) return;

    try {
      showLoader();

      const params: Record<string, any> = {
        ownerId: ownerIdForUser,
        page: geofencePage,
        limit: geofenceLimit,
        search: debouncedGeofenceSearch || undefined,
      };

      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === "" || params[k] === null) {
          delete params[k];
        }
      });

      const res = await api.get("/geofence", { params });
      const data = res?.data ?? {};

      const items: GeofenceRow[] = Array.isArray(data.items) ? data.items : [];

      setGeofences(items);

      const total: number =
        typeof data.total === "number" ? data.total : items.length;

      const currentLimit: number =
        data.limit && typeof data.limit === "number"
          ? data.limit
          : geofenceLimit;
      const totalPages =
        currentLimit > 0 ? Math.max(1, Math.ceil(total / currentLimit)) : 1;
      setGeofenceTotalPages(totalPages);
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const fetchGps = async () => {
    if (!ownerIdForUser) return;

    try {
      showLoader();

      const params: any = {
        page: gpsPage,
        limit: gpsLimit,
        search: debouncedGpsSearch || undefined,
        ownerId: ownerIdForUser,
        linked: gpsLinked || undefined,
        sortBy: gpsSortBy || undefined,
        sortOrder: gpsSortOrder || undefined,
      };

      Object.keys(params).forEach((k) => {
        if (params[k] === "" || params[k] === undefined) delete params[k];
      });

      const res = await api.get("/admin/gps", { params });
      const data = res?.data ?? {};

      setGpsList(Array.isArray(data.data) ? data.data : []);

      const pagination = data.pagination ?? {};
      const totalPages = pagination.totalPages ?? 1;

      setGpsTotalPages(totalPages);
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const fetchAssistants = async () => {
    if (!user || user.role !== "owner") return;

    try {
      showLoader();
      const params: Record<string, any> = {
        page: assistantsPage,
        limit: 10,
        search: debouncedAssistantsSearch || "",
        ownerId: user._id,
      };

      const res = await api.get("/admin/users", { params });

      if (res?.data?.success) {
        setAssistants(res.data.users || []);
        setAssistantsTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  // reset geofence page when search changes
  useEffect(() => {
    setGeofencePage(1);
  }, [debouncedGeofenceSearch]);

  useEffect(() => {
    setGpsPage(1);
  }, [debouncedGpsSearch, gpsLinked, gpsSortBy, gpsSortOrder]);

  // fetch geofences when owner + page / search ready
  useEffect(() => {
    if (!ownerIdForUser) return;
    fetchGeofences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerIdForUser, geofencePage, geofenceLimit, debouncedGeofenceSearch]);

  useEffect(() => {
    if (!ownerIdForUser) return;
    fetchGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ownerIdForUser,
    gpsPage,
    gpsLimit,
    debouncedGpsSearch,
    gpsLinked,
    gpsSortBy,
    gpsSortOrder,
  ]);

  useEffect(() => {
    if (user?.role === "owner") {
      fetchAssistants();
    }
  }, [user, assistantsPage, debouncedAssistantsSearch]);
  /* -------------------------------------------------------------------------- */
  /*                              TABLE COLUMNS                                  */
  /* -------------------------------------------------------------------------- */

  const animalColumns: DataTableColumn<AnimalRow>[] = [
    {
      key: "image",
      label: "Image",
      render: (a) => (
        <ImageWithFallback
          src={a.profilePicture}
          alt={a.name || a.uniqueAnimalId}
          className="w-12 h-12 rounded-md object-cover"
        />
      ),
    },
    {
      key: "id",
      label: "ID",
      render: (a) => a._id || "—",
    },
    {
      key: "uniqueAnimalId",
      label: "Animal ID",
      render: (a) => a.uniqueAnimalId || "—",
    },
    {
      key: "name",
      label: "Name",
      render: (a) => a.name || "—",
    },
    {
      key: "typeKey",
      label: "Type",
      render: (a) => a.typeNameEn || a.typeKey || "—",
    },
    {
      key: "breedKey",
      label: "Breed",
      render: (a) => a.breedNameEn || a.breedKey || "—",
    },
    {
      key: "gender",
      label: "Gender",
      render: (a) => a.gender || "—",
    },
    {
      key: "animalStatus",
      label: "Status",
      render: (a) => a.animalStatus || "—",
    },
    {
      key: "hasVaccinated",
      label: "Vaccinated",
      render: (a) =>
        typeof a.hasVaccinated === "boolean"
          ? a.hasVaccinated
            ? "Yes"
            : "No"
          : "—",
    },
    {
      key: "createdAt",
      label: "Created",
      render: (a) =>
        a.createdAt ? new Date(a.createdAt).toLocaleString() : "—",
    },
    {
      key: "actions",
      label: "Actions",
      render: (a) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAnimalToDelete(a);
            setAnimalDeleteModalOpen(true);
          }}
          className="px-3 py-1 text-xs rounded-lg border border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
        >
          Delete
        </button>
      ),
    },
  ];

  const geofenceColumns: DataTableColumn<GeofenceRow>[] = [
    {
      key: "name",
      label: "Name",
      render: (g) => g.name || "—",
    },
    {
      key: "city",
      label: "City",
      render: (g) => g.city || "—",
    },
    {
      key: "country",
      label: "Country",
      render: (g) => g.country || "—",
    },
    {
      key: "radiusKm",
      label: "Radius (km)",
      render: (g) =>
        typeof g.radiusKm === "number" ? g.radiusKm.toString() : "—",
    },
    {
      key: "animalsCount",
      label: "Animals Count",
      render: (g) => (g.animals ? g.animals.length : 0),
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (g) =>
        g.createdAt ? new Date(g.createdAt).toLocaleString() : "—",
    },
    {
      key: "actions",
      label: "Actions",
      render: (g) => (
        <button
          type="button"
          onClick={() => {
            setSelectedGeofenceAnimals(g.animals || []);
            setIsAnimalsModalOpen(true);
          }}
          disabled={!g.animals || g.animals.length === 0}
          className={`px-3 py-1 rounded-md text-xs font-medium transition ${
            !g.animals || g.animals.length === 0
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-[#4F46E5] text-white hover:bg-[#0000CC]"
          }`}
        >
          View Animals
        </button>
      ),
    },
    {
      key: "delete",
      label: "Actions",
      render: (g) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setGeofenceToDelete(g);
            setGeofenceDeleteModalOpen(true);
          }}
          className="px-2 py-1 rounded text-xs border border-red-600 text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      ),
    },
  ];

  const gpsColumns: DataTableColumn<GPSRow>[] = [
    {
      key: "serialNumber",
      label: "Serial",
      render: (g) => g.serialNumber || "—",
    },
    {
      key: "linked",
      label: "Linked",
      render: (g) => (g.isLinked ? "Yes" : "No"),
    },
    {
      key: "animal",
      label: "Animal",
      render: (g) =>
        g.animal?.uniqueAnimalId
          ? `${g.animal.uniqueAnimalId} (${g.animal.name})`
          : "—",
    },
    {
      key: "createdAt",
      label: "Created",
      render: (g) =>
        g.createdAt ? new Date(g.createdAt).toLocaleString() : "—",
    },
    {
      key: "linkedAt",
      label: "Linked At",
      render: (g) => (g.linkedAt ? new Date(g.linkedAt).toLocaleString() : "—"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (g) => (
        <div className="flex gap-2">
          {/* Unlink Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGpsToAction(g);
              setGpsUnlinkModalOpen(true);
            }}
            disabled={!g.isLinked}
            className={`px-2 py-1 rounded text-xs border ${
              g.isLinked
                ? "border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                : "border-gray-400 text-gray-400 cursor-not-allowed"
            }`}
          >
            Unlink
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGpsToAction(g);
              setGpsDeleteModalOpen(true);
            }}
            disabled={g.isLinked}
            className={`px-2 py-1 rounded text-xs border ${
              g.isLinked
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

  const assistantColumns: DataTableColumn<User>[] = [
    {
      key: "name",
      label: "Name",
      render: (u) => u.name || "—",
    },
    {
      key: "email",
      label: "Email",
      render: (u) => u.email || "—",
    },
    {
      key: "_id",
      label: "User ID",
      render: (u) => u._id || "—",
    },
    {
      key: "createdAt",
      label: "Created",
      render: (u) =>
        u.createdAt ? new Date(u.createdAt).toLocaleString() : "—",
    },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAssistantToDelete(u);
            setAssistantDeleteModalOpen(true);
          }}
          className="px-3 py-1 text-xs rounded-lg border border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
        >
          Delete
        </button>
      ),
    },
  ];
  /* -------------------------------------------------------------------------- */
  /*                            PAGINATION BUTTONS                               */
  /* -------------------------------------------------------------------------- */

  const renderAnimalPagination = () => {
    const buttons: React.ReactNode[] = [];
    const startPage = Math.max(1, animalsPage - 1);
    const endPage = Math.min(animalsTotalPages, animalsPage + 1);

    buttons.push(
      <button
        key="prev"
        onClick={() => setAnimalsPage((p) => Math.max(1, p - 1))}
        disabled={animalsPage === 1}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          animalsPage === 1
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
          onClick={() => setAnimalsPage(num)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            animalsPage === num
              ? "bg-[#4F46E5] text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {num}
        </button>
      );
    }

    if (endPage < animalsTotalPages - 1) {
      buttons.push(
        <span
          key="ellipsis"
          className="px-2 text-gray-500 dark:text-gray-400 select-none"
        >
          ...
        </span>
      );
    }

    if (endPage < animalsTotalPages) {
      buttons.push(
        <button
          key={animalsTotalPages}
          onClick={() => setAnimalsPage(animalsTotalPages)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            animalsPage === animalsTotalPages
              ? "bg-[#4F46E5] text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {animalsTotalPages}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        onClick={() =>
          setAnimalsPage((p) => Math.min(animalsTotalPages, p + 1))
        }
        disabled={animalsPage === animalsTotalPages}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          animalsPage === animalsTotalPages
            ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        Next
      </button>
    );

    return buttons;
  };

  const renderGeofencePagination = () => {
    const buttons: React.ReactNode[] = [];
    const startPage = Math.max(1, geofencePage - 1);
    const endPage = Math.min(geofenceTotalPages, geofencePage + 1);

    // Prev
    buttons.push(
      <button
        key="prev"
        onClick={() => setGeofencePage((p) => Math.max(1, p - 1))}
        disabled={geofencePage === 1}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          geofencePage === 1
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
          onClick={() => setGeofencePage(num)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            geofencePage === num
              ? "bg-[#4F46E5] text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {num}
        </button>
      );
    }

    if (endPage < geofenceTotalPages - 1) {
      buttons.push(
        <span
          key="ellipsis"
          className="px-2 text-gray-500 dark:text-gray-400 select-none"
        >
          ...
        </span>
      );
    }

    if (endPage < geofenceTotalPages) {
      buttons.push(
        <button
          key={geofenceTotalPages}
          onClick={() => setGeofencePage(geofenceTotalPages)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            geofencePage === geofenceTotalPages
              ? "bg-[#4F46E5] text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {geofenceTotalPages}
        </button>
      );
    }

    // Next
    buttons.push(
      <button
        key="next"
        onClick={() =>
          setGeofencePage((p) => Math.min(geofenceTotalPages, p + 1))
        }
        disabled={geofencePage === geofenceTotalPages}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          geofencePage === geofenceTotalPages
            ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        Next
      </button>
    );

    return buttons;
  };

  /* -------------------------------------------------------------------------- */
  /*                               GENDER / BREED                                */
  /* -------------------------------------------------------------------------- */

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);

    if (values.includes("all")) {
      setGenderFilter([]); // clear filter
    } else {
      setGenderFilter(values);
    }
  };

  const handleBreedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);

    if (values.includes("all")) {
      setBreedFilter([]); // clear filter
    } else {
      setBreedFilter(values);
    }
  };

  const handleDeleteUser = async () => {
    if (!id) return;

    try {
      showLoader();
      const res = await api.delete(`/auth/${id}`);
      if (res?.data?.success) {
        showAlert(
          "success",
          user?.role === "owner"
            ? "Owner deleted with all related animals, assistants, GPS and geofences"
            : "User deleted"
        );
        navigate("/users");
      } else {
        showAlert("error", "Delete failed");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const handleDeleteAssistant = async () => {
    if (!assistantToDelete?._id) return;

    try {
      showLoader();
      const res = await api.delete(`/auth/${assistantToDelete._id}`);

      if (res?.data?.success) {
        showAlert("success", "Assistant deleted");
        fetchAssistants();
      } else {
        showAlert("error", "Delete failed");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const handleDeleteAnimal = async () => {
    if (!animalToDelete?._id) return;

    try {
      showLoader();
      const res = await api.delete(`/animals/${animalToDelete._id}`);

      if (res?.data?.success) {
        showAlert("success", "Animal deleted successfully");
        fetchAnimals();
      } else {
        showAlert("error", "Delete failed");
      }
    } catch (err) {
      showApiError(err);
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
        showAlert("error", "Unlink failed");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setGpsUnlinkModalOpen(false);
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
        showAlert("error", "Delete failed");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setGpsDeleteModalOpen(false);
    }
  };

  /* --------------------- GEOFENCE ACTION --------------------- */

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
      setGeofenceDeleteModalOpen(false);
    }
  };
  /* -------------------------------------------------------------------------- */
  /*                                  RENDER                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 w-full max-w-full overflow-x-hidden">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">
                User Details
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="px-3 py-1 rounded-lg border border-red-600 hover:bg-gray-100 text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* -------------------------- USER CARD -------------------------- */}

            <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 sm:p-6">
              {user ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      User ID
                    </div>
                    <div className="font-mono text-gray-900 dark:text-gray-100 break-all">
                      {user._id}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Email
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.email || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Name
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.name || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Gender
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.gender || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Phone
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.phone || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Full Phone
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.fullPhone || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Country Code
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.countryCode || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Role
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.role?.toUpperCase() || "—"}
                    </div>
                  </div>

                  {user.role == "assistant" && (
                    <div>
                      <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                        Owner ID
                      </div>
                      <div className="text-gray-900 dark:text-gray-100">
                        {user?.ownerId || "—"}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Animal Type
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.animalType || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Language
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.language || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Email Verified
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.isEmailVerified ? "Yes" : "No"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Phone Verified
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.isPhoneVerified ? "Yes" : "No"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Created At
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Loading user...
                </div>
              )}
            </div>

            {user?.role === "owner" && !!user?.assistantIds?.length && (
              <>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-10 mb-2">
                  Assistants of {user?.name || "this owner"}
                </h2>

                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Search assistants..."
                    value={assistantsSearch}
                    onChange={(e) => setAssistantsSearch(e.target.value)}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 
        text-sm rounded-lg px-3 py-2 w-full sm:w-64"
                  />
                </div>

                <DataTable<User>
                  data={assistants}
                  columns={assistantColumns}
                  emptyMessage="No assistants found"
                  onRowClick={(row) => navigate(`/user/${row._id}`)}
                />

                {/* pagination */}
                <div className="flex justify-center mt-4 gap-2">
                  <button
                    onClick={() => setAssistantsPage((p) => Math.max(1, p - 1))}
                    disabled={assistantsPage === 1}
                    className="px-3 py-1 rounded-md bg-gray-200 disabled:bg-gray-400"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      setAssistantsPage((p) =>
                        Math.min(p + 1, assistantsTotalPages)
                      )
                    }
                    disabled={assistantsPage === assistantsTotalPages}
                    className="px-3 py-1 rounded-md bg-gray-200 disabled:bg-gray-400"
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {user?.role === "assistant" && (
              <div
                onClick={() => {
                  navigate(`/user/${user.ownerId}`);
                }}
                className="mt-10 cursor-pointer rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4"
              >
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
                  Owner Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Owner ID
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.ownerId || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Email
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.email || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Name
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {user.name || "—"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------ ANIMALS SECTION ------------------------ */}

            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Animals of {`${user?.name ?? "this user"}`}
            </h2>

            {/* SUMMARY BAR */}
            <div className="flex gap-6 text-sm font-medium mb-4 dark:text-white">
              <span>Male: {totalMale}</span>
              <span>Female: {totalFemale}</span>
              <span>Unknown: {totalUnknown}</span>
              <span>Total: {animalsTotal}</span>
            </div>
            {/* FILTERS */}
            <div className="flex flex-col gap-3 mb-4 w-full">
              {/* Row 1 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search animals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2"
                />

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="dead">Dead</option>
                  <option value="transferred">Transferred</option>
                </select>

                <input
                  type="text"
                  placeholder="Type key…"
                  value={typeKey}
                  onChange={(e) => setTypeKey(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2"
                />
              </div>

              {/* Row 2 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={hasVaccinated}
                  onChange={(e) => setHasVaccinated(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                >
                  <option value="">All Vaccination</option>
                  <option value="true">Vaccinated</option>
                  <option value="false">Not Vaccinated</option>
                </select>

                <select
                  value={genderFilter}
                  onChange={handleGenderChange}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                >
                  <option value="">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>

                <select
                  value={breedFilter.length ? breedFilter : [""]}
                  onChange={handleBreedChange}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full min-h-[42px] focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                >
                  <option value="">All</option>
                  {breedOptions.map((b) => (
                    <option key={b._id} value={b.key}>
                      {b.name_en || b.key}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 3 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-1 gap-2">
                  <input
                    type="number"
                    placeholder="From age"
                    value={fromAge}
                    onChange={(e) => setFromAge(e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2"
                  />
                  <input
                    type="number"
                    placeholder="To age"
                    value={toAge}
                    onChange={(e) => setToAge(e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2"
                  />
                </div>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                >
                  <option value="name_asc">Name A → Z</option>
                  <option value="name_desc">Name Z → A</option>
                  <option value="date_latest">Latest First</option>
                  <option value="date_oldest">Oldest First</option>
                  <option value="age_young_to_old">Young → Old</option>
                  <option value="age_old_to_young">Old → Young</option>
                </select>

                <button
                  onClick={() => {
                    setAnimalsPage(1);
                    fetchAnimals();
                  }}
                  className="flex-1 bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* ------------------------- TABLE ------------------------- */}

            <DataTable<AnimalRow>
              data={animals}
              columns={animalColumns}
              onRowClick={(row) => navigate(`/animal/${row._id}`)}
              emptyMessage={
                ownerIdForUser
                  ? "No animals found for this user"
                  : "No owner id available"
              }
            />

            {/* --------------------- PAGINATION --------------------- */}

            <div className="flex flex-wrap justify-center mt-5 gap-2">
              {renderAnimalPagination()}
            </div>

            <div className="mt-10 mb-4 flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Geofences of {`${user?.name ?? "this user"}`}
              </h2>
            </div>

            {/* Geofence search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 w-full">
              <input
                type="text"
                placeholder="Search geofences..."
                value={geofenceSearch}
                onChange={(e) => setGeofenceSearch(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
              />

              <button
                onClick={() => {
                  setGeofencePage(1);
                  fetchGeofences();
                }}
                className="bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm w-full sm:w-auto transition"
              >
                Apply
              </button>
            </div>

            <DataTable<GeofenceRow>
              data={geofences}
              columns={geofenceColumns}
              onRowClick={() => {}}
              emptyMessage={
                ownerIdForUser
                  ? "No geofences found for this user"
                  : "No owner id available for this user"
              }
            />

            {/* Pagination for geofences */}
            <div className="flex flex-wrap justify-center mt-5 gap-2">
              {renderGeofencePagination()}
            </div>

            {/* -------------------- GPS SECTION -------------------- */}

            <div className="mt-10 mb-4 flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                GPS Devices of this User
              </h2>
            </div>

            {/* GPS Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 w-full">
              <input
                type="text"
                placeholder="Search GPS..."
                value={gpsSearch}
                onChange={(e) => setGpsSearch(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2"
              />

              <select
                value={gpsLinked}
                onChange={(e) => setGpsLinked(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
              >
                <option value="">All Linked</option>
                <option value="true">Linked</option>
                <option value="false">Not Linked</option>
              </select>

              <select
                value={gpsSortBy}
                onChange={(e) => setGpsSortBy(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
              >
                <option value="">Sort By</option>
                <option value="serialNumber">Serial Number</option>
                <option value="createdAt">Created At</option>
                <option value="linkedAt">Linked At</option>
              </select>

              <select
                value={gpsSortOrder}
                onChange={(e) => setGpsSortOrder(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
              >
                <option value="">Order</option>
                <option value="asc">ASC</option>
                <option value="desc">DESC</option>
              </select>

              <button
                onClick={() => {
                  setGpsPage(1);
                  fetchGps();
                }}
                className="bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm"
              >
                Apply
              </button>
            </div>

            <DataTable<GPSRow>
              data={gpsList}
              columns={gpsColumns}
              onRowClick={() => {}}
              emptyMessage="No GPS devices found for this user"
            />

            {/* GPS Pagination */}
            <div className="flex flex-wrap justify-center mt-5 gap-2">
              {Array.from({ length: gpsTotalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setGpsPage(i + 1)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    gpsPage === i + 1
                      ? "bg-[#4F46E5] text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </PageWrapper>
      </main>
      {isAnimalsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsAnimalsModalOpen(false);
              setSelectedGeofenceAnimals([]);
            }}
          />
          {/* Modal */}
          <div className="relative z-10 w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Animals in Geofence
              </h3>
              <button
                onClick={() => {
                  setIsAnimalsModalOpen(false);
                  setSelectedGeofenceAnimals([]);
                }}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {selectedGeofenceAnimals.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No animals assigned to this geofence.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedGeofenceAnimals.map((a) => (
                    <div
                      key={a._id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60"
                    >
                      <ImageWithFallback
                        src={a.profilePicture}
                        alt={a.name || a.uniqueAnimalId}
                        className="w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {a.name || "—"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {a.uniqueAnimalId || "—"}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                          <span>Type: {a.typeNameEn || a.typeKey || "—"}</span>
                          <span>
                            Breed: {a.breedNameEn || a.breedKey || "—"}
                          </span>
                          <span>Gender: {a.gender || "—"}</span>
                          <span>Status: {a.animalStatus || "—"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setIsAnimalsModalOpen(false);
                  setSelectedGeofenceAnimals([]);
                }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete User?"
        description={
          user?.role === "owner"
            ? `This will permanently delete the owner ${
                user?.name ?? ""
              } and ALL related animals, assistants, GPS devices, and geofences. Are you sure?`
            : `This will permanently delete the assistant ${
                user?.name ?? ""
              }. Are you sure?`
        }
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={() => {
          setDeleteModalOpen(false);
          handleDeleteUser();
        }}
      />

      <Modal
        open={assistantDeleteModalOpen}
        onClose={() => setAssistantDeleteModalOpen(false)}
        title="Delete Assistant?"
        description={`This will permanently delete the assistant ${
          assistantToDelete?.name ?? ""
        }. Are you sure?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={() => {
          setAssistantDeleteModalOpen(false);
          handleDeleteAssistant();
        }}
      />
      <Modal
        open={animalDeleteModalOpen}
        onClose={() => setAnimalDeleteModalOpen(false)}
        title="Delete Animal?"
        description={`This will permanently delete the animal ${
          animalToDelete?.name || animalToDelete?.uniqueAnimalId || ""
        }. Are you sure?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={() => {
          setAnimalDeleteModalOpen(false);
          handleDeleteAnimal();
        }}
      />

      <Modal
        open={gpsUnlinkModalOpen}
        onClose={() => setGpsUnlinkModalOpen(false)}
        title="Unlink GPS?"
        description={`Unlink GPS device ${gpsToAction?.serialNumber}?`}
        confirmText="Unlink"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={handleUnlinkGps}
      />

      {/* GPS Delete Modal */}
      <Modal
        open={gpsDeleteModalOpen}
        onClose={() => setGpsDeleteModalOpen(false)}
        title="Delete GPS?"
        description={`Delete GPS device ${gpsToAction?.serialNumber}?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={handleDeleteGps}
      />

      {/* Geofence Delete Modal */}
      <Modal
        open={geofenceDeleteModalOpen}
        onClose={() => setGeofenceDeleteModalOpen(false)}
        title="Delete Geofence?"
        description={`Delete geofence "${geofenceToDelete?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={handleDeleteGeofence}
      />
    </div>
  );
};

export default UserDetailsPage;
