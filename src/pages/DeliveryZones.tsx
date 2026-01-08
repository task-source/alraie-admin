import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { FiSearch } from "react-icons/fi";
import FilterDropdown from "../components/FilterDropdown";
import { useNavigate } from "react-router-dom";

interface DeliveryZoneRow {
  _id: string;
  country?: string;
  state?: string;
  city?: string;
  currency?: string;
  deliveryFee?: number;
  taxPercent?: number;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  priority?: number;
  isActive?: boolean;
  createdAt?: string;
}

const DeliveryZones: React.FC = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { showApiError, showAlert } = useAlert();

  /* ---------------- DATA ---------------- */
  const [zones, setZones] = useState<DeliveryZoneRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /* ---------------- FILTERS ---------------- */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedCountry, setDebouncedCountry] = useState("");
  const [debouncedState, setDebouncedState] = useState("");
  const [debouncedCity, setDebouncedCity] = useState("");
  const [debouncedCurrency, setDebouncedCurrency] = useState("");
  const [country, setCountry] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("");
  const [isActive, setIsActive] = useState<string>("");

  const [sortBy, setSortBy] = useState("priority");
  const [sortOrder, setSortOrder] = useState("desc");
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<DeliveryZoneRow | null>(null);

  const [form, setForm] = useState({
    country: "",
    state: "",
    city: "",
    currency: "",
    deliveryFee: "",
    taxPercent: "",
    deliveryTimeMin: "",
    deliveryTimeMax: "",
    isActive: true,
  });
  /* ---------------- DEBOUNCE ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCountry(country), 500);
    return () => clearTimeout(t);
  }, [country]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedState(stateName), 500);
    return () => clearTimeout(t);
  }, [stateName]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCity(city), 500);
    return () => clearTimeout(t);
  }, [city]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCurrency(currency), 500);
    return () => clearTimeout(t);
  }, [currency])
  /* ---------------- FETCH ---------------- */
  const fetchZones = async () => {
    try {
      showLoader();

      const params: any = {
        page,
        limit,
        search: debouncedSearch || undefined,
        country: debouncedCountry || undefined,
        state: debouncedState || undefined,
        city: debouncedCity || undefined,
        currency: debouncedCurrency || undefined,
        isActive: isActive || undefined,
        sortBy,
        sortOrder,
      };

      Object.keys(params).forEach(
        (k) => params[k] === undefined && delete params[k]
      );

      const res = await api.get("/deliveryZone", { params });

      if (res?.data?.success) {
        setZones(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setZones([]);
      }
    } catch (err) {
      showApiError(err);
      setZones([]);
    } finally {
      hideLoader();
    }
  };

  const toggleActive = async (zone: DeliveryZoneRow) => {
    try {
      showLoader();
      await api.put(`/deliveryZone/${zone._id}`, {
        isActive: !zone.isActive,
      });
      fetchZones();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const deleteZone = async (zoneId: string) => {
    try {
      showLoader();
      await api.delete(`/deliveryZone/${zoneId}`);
      fetchZones();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const openCreateDialog = () => {
    setEditing(null);
    setForm({
      country: "",
      state: "",
      city: "",
      currency: "",
      deliveryFee: "",
      taxPercent: "",
      deliveryTimeMin: "",
      deliveryTimeMax: "",
      isActive: true,
    });
    setOpenDialog(true);
  };

  const openEditDialog = (zone: DeliveryZoneRow) => {
    setEditing(zone);
    setForm({
      country: zone.country || "",
      state: zone.state || "",
      city: zone.city || "",
      currency: zone.currency || "",
      deliveryFee: String(zone.deliveryFee ?? ""),
      taxPercent: String(zone.taxPercent ?? ""),
      deliveryTimeMin: String(zone.deliveryTimeMin ?? ""),
      deliveryTimeMax: String(zone.deliveryTimeMax ?? ""),
      isActive: !!zone.isActive,
    });
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setEditing(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.country.trim()) {
      showApiError("Country is required");
      return false;
    }
    if (!form.currency.trim()) {
      showApiError("Currency is required");
      return false;
    }
    if (form.deliveryFee === "") {
      showApiError("Delivery fee is required");
      return false;
    }
    if (form.taxPercent === "") {
      showApiError("Tax percent is required");
      return false;
    }
    return true;
  };


  const handleSubmit = async () => {
    try {
      showLoader();

      if (editing) {
        // UPDATE – only allowed fields
        await api.put(`/deliveryZone/${editing._id}`, {
          currency: form.currency,
          deliveryFee: Number(form.deliveryFee),
          taxPercent: Number(form.taxPercent),
          deliveryTimeMin: Number(form.deliveryTimeMin),
          deliveryTimeMax: Number(form.deliveryTimeMax),
          isActive: form.isActive,
        });
        showAlert("success", "Delivery zone updated");
      } else {
        // CREATE
        await api.post("/deliveryZone", {
          country: form.country,
          state: form.state || undefined,
          city: form.city || undefined,
          currency: form.currency,
          deliveryFee: Number(form.deliveryFee),
          taxPercent: Number(form.taxPercent),
          deliveryTimeMin: Number(form.deliveryTimeMin),
          deliveryTimeMax: Number(form.deliveryTimeMax),
          isActive: form.isActive,
        });
        showAlert("success", "Delivery zone created");
      }

      closeDialog();
      fetchZones();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  /* reset page when filters change */
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    debouncedCountry,
    debouncedState,
    debouncedCity,
    debouncedCurrency,
    isActive,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    debouncedSearch,
    debouncedCountry,
    debouncedState,
    debouncedCity,
    debouncedCurrency,
    isActive,
    sortBy,
    sortOrder,
  ]);

  /* ---------------- TABLE ---------------- */
  const columns: DataTableColumn<DeliveryZoneRow>[] = [
    {
      key: "location",
      label: "Location",
      render: (z) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">
            {z.city || "—"}, {z.state || "—"}
          </span>
          <span className="text-xs text-gray-500">
            {z.country || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "currency",
      label: "Currency",
      render: (z) => z.currency || "—",
    },
    {
      key: "fee",
      label: "Delivery Fee",
      render: (z) =>
        z.deliveryFee !== undefined ? `${z.deliveryFee}` : "—",
    },
    {
      key: "tax",
      label: "Tax %",
      render: (z) =>
        z.taxPercent !== undefined ? `${z.taxPercent}%` : "—",
    },
    {
      key: "time",
      label: "Delivery Time",
      render: (z) =>
        z.deliveryTimeMin && z.deliveryTimeMax
          ? `${z.deliveryTimeMin}–${z.deliveryTimeMax} days`
          : "—",
    },
    {
      key: "priority",
      label: "Priority",
      render: (z) => z.priority ?? "—",
    },
    {
      key: "status",
      label: "Status",
      render: (z) => (
        <span
          className={`px-2 py-0.5 rounded-md text-xs font-medium ${z.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
            }`}
        >
          {z.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (z) =>
        z.createdAt ? new Date(z.createdAt).toLocaleString() : "—",
    },
    {
      key: "actions",
      label: "Actions",
      render: (z) => (
        <div className="flex gap-2">
          <button
            onClick={() => toggleActive(z)}
            className="px-3 py-1 rounded-md border text-xs"
          >
            {z.isActive ? "Deactivate" : "Activate"}
          </button>

          <button
            onClick={() => openEditDialog(z)}
            className="px-3 py-1 rounded-md border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white text-xs"
          >
            Edit
          </button>

          <button
            onClick={() => deleteZone(z._id)}
            className="px-3 py-1 rounded-md border border-red-600 text-red-600 hover:bg-red-50 text-xs"
          >
            Delete
          </button>
        </div>
      ),
    }
  ];

  /* ---------------- PAGINATION (SAME AS PRODUCTS) ---------------- */
  const renderPaginationButtons = () => {
    const buttons = [];
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

    buttons.push(
      <button
        key="prev"
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
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

    if (endPage < totalPages) {
      buttons.push(
        <button
          key="next"
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === totalPages
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
        >
          Next
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 w-full max-w-full overflow-x-hidden">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">
                Delivery Zones
              </h1>

              <button
                onClick={openCreateDialog}
                className="bg-[#4F46E5] hover:bg-[#0000CC] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                + Add Delivery Zone
              </button>
            </div>
            {/* FILTERS */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country / state / city"
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-10 py-2 focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                />
                <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                />
                <input
                  placeholder="State"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                />
                <input
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  placeholder="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
                />

                <FilterDropdown
                  label="Status"
                  value={isActive}
                  onChange={setIsActive}
                  className="flex-1"
                  options={[
                    { label: "All", value: "" },
                    { label: "Active", value: "true" },
                    { label: "Inactive", value: "false" },
                  ]}
                />

                <FilterDropdown
                  label="Sort By"
                  value={sortBy}
                  onChange={setSortBy}
                  className="flex-1"
                  options={[
                    { label: "Priority", value: "priority" },
                    { label: "Created At", value: "createdAt" },
                    { label: "Delivery Fee", value: "deliveryFee" },
                    { label: "Tax %", value: "taxPercent" },
                  ]}
                />

                <FilterDropdown
                  label="Order"
                  value={sortOrder}
                  onChange={setSortOrder}
                  className="flex-1"
                  options={[
                    { label: "Descending", value: "desc" },
                    { label: "Ascending", value: "asc" },
                  ]}
                />
              </div>
            </div>

            <DataTable<DeliveryZoneRow>
              data={zones}
              columns={columns}
              emptyMessage="No delivery zones found"
            />

            <div className="flex flex-wrap justify-center mt-5 gap-2">
              {renderPaginationButtons()}
            </div>
          </div>
        </PageWrapper>
        {openDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700">

              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                {editing ? "Edit Delivery Zone" : "Add Delivery Zone"}
              </h2>

              <div className="grid grid-cols-1 gap-3">

                {/* Country – CREATE ONLY */}
                {!editing && (
                  <input
                    placeholder="Country"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                  />
                )}

                {/* Read-only location – EDIT */}
                {editing && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 border dark:text-white">
                    {editing.city}, {editing.state}, {editing.country}
                  </div>
                )}

                {!editing && (
                  <input
                    placeholder="State (optional)"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                  />
                )}

                {/* City – CREATE ONLY (optional) */}
                {!editing && (
                  <input
                    placeholder="City (optional)"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                  />
                )}

                <input
                  placeholder="Currency"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                />

                <input
                  type="number"
                  placeholder="Delivery Fee"
                  value={form.deliveryFee}
                  onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                  className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                />

                <input
                  type="number"
                  placeholder="Tax %"
                  value={form.taxPercent}
                  onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) <= 100 ? e.target.value : "100" })}
                  className="border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                />

                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min Time (days)"
                    value={form.deliveryTimeMin}
                    onChange={(e) => setForm({ ...form, deliveryTimeMin: e.target.value })}
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                  />

                  <input
                    type="number"
                    placeholder="Max Time (days)"
                    value={form.deliveryTimeMax}
                    onChange={(e) => setForm({ ...form, deliveryTimeMax: e.target.value })}
                    className="flex-1 border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeDialog}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button onClick={handleSubmit}
                  className="px-4 py-2 bg-[#4F46E5] hover:bg-[#0000CC] text-white rounded-lg text-sm transition w-full sm:w-auto">
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DeliveryZones;
