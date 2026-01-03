import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import FilterDropdown from "../components/FilterDropdown";


interface OwnerUser {
  _id: string;
  email?: string;
  phone?: string;
  fullPhone? :string;
  name?:string;
}

const AssignSubscription: React.FC = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showAlert, showApiError } = useAlert();
  const navigate = useNavigate();

  /* ---------------- Owner Search ---------------- */
  const [ownerSearch, setOwnerSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<OwnerUser[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<OwnerUser | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* ---------------- Subscription ---------------- */
  const [planKey, setPlanKey] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");

  /* ---------------- Debounce ---------------- */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(ownerSearch.trim());
    }, 500);
    return () => clearTimeout(t);
  }, [ownerSearch]);

  /* ---------------- Fetch Owners ---------------- */
  useEffect(() => {
    if (!debouncedSearch) {
      setOwnerResults([]);
      return;
    }

    const fetchOwners = async () => {
      try {
        const res = await api.get("/admin/users", {
          params: { role: "owner", search: debouncedSearch },
        });
        if (res?.data?.success) {
          setOwnerResults(res.data.users || []);
          setShowSuggestions(true);
        }
      } catch {
        setOwnerResults([]);
      }
    };

    fetchOwners();
  }, [debouncedSearch]);


  /* ---------------- Submit ---------------- */
  const handleAssign = async () => {
    if (!selectedOwner?._id) {
      showAlert("error", "Please select an owner");
      return;
    }


    if (!planKey) {
        showAlert("error", "Please select a plan");
        return;
      }
    
    try {
      showLoader();
      const res = await api.post("/userSubscriptions/assign", {
        ownerId: selectedOwner._id,
        planKey,
        cycle,
        price: Number(price),
        currency,
      });

      if (res?.data?.success) {
        showAlert("success", "Subscription assigned");
        navigate("/subscriptions/users");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 max-w-3xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Assign Subscription
              </h1>
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-sm dark:text-white"
              >
                Back
              </button>
            </div>

            {/* Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5">

              {/* Owner Search */}
              <div className="relative">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Owner (email / phone / ID)
                </label>

                <input
                  value={ownerSearch}
                  onChange={(e) => {
                    setOwnerSearch(e.target.value);
                    setSelectedOwner(null);
                  }}
                  onFocus={() => ownerResults.length && setShowSuggestions(true)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                />

                {/* Suggestions */}
                {showSuggestions && ownerResults.length > 0 && !selectedOwner && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-auto shadow-lg">
                    {ownerResults.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => {
                          setSelectedOwner(u);
                          setOwnerSearch(u.email || u.phone || u._id);
                          setOwnerResults([]);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
                      >
                        {u.name || u.email || u.phone || u._id}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Owner */}
              {selectedOwner && (
                <div className="flex flex-col gap-3 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-md">
                  <span>Owner ID: {selectedOwner._id}</span>
                 {!!selectedOwner.name && <span>Owner Name: {selectedOwner.name}</span>}
                 {!!selectedOwner.email &&<span>Owner Email: {selectedOwner.email}</span>}
                 {!!selectedOwner.fullPhone &&<span>Owner Phone: {selectedOwner.fullPhone}</span>}
                </div>
              )}

              {/* Plan */}
              <div className="flex flex-col gap-3">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Plan (upgrade only)
                </label>
                <div className="flex flex-row gap-3">
                <FilterDropdown
      label="Plan"
      value={planKey}
      onChange={setPlanKey}
      className="flex-1"
      options={[
        { label: "Select plan", value: "" },
        { label: "BASIC", value: "basic" },
        { label: "STANDARD", value: "standard" },
        { label: "PROFESSIONAL", value: "professional" },
        { label: "ENTERPRISE", value: "enterprise" },
      ]}
    />

    <FilterDropdown
      label="Billing Cycle"
      value={cycle}
      onChange={(v) => setCycle(v as "monthly" | "yearly")}
      className="flex-1"
      options={[
        { label: "Monthly", value: "monthly" },
        { label: "Yearly", value: "yearly" },
      ]}
    />
                </div>
              </div>

              {/* Billing */}
              <div className="flex flex-row gap-3">

                <input
                  type="number"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
                />

                <input
                  placeholder="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-28 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleAssign}
                disabled={!selectedOwner || !planKey}
                className={`w-full py-2 rounded-lg text-sm font-medium transition
                  ${!selectedOwner || !planKey
                    ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed dark:text-gray-400"
                    : "bg-[#4F46E5] hover:bg-[#0000CC] text-white"
                  }`}
              >
                Assign Subscription
              </button>

            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
};

export default AssignSubscription;
