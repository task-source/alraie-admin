import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";

interface Plan {
  _id: string;
  planKey: string;
  name_en?: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  features_en?: string[];
  features_ar?: string[];
  maxAnimals?: number;
  maxAssistants?: number;
  iosProductId_monthly?: string;
  iosProductId_yearly?: string;
  androidProductId_monthly?: string;
  androidProductId_yearly?: string;
  isPublic?: boolean;
}

const SubscriptionPlanEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { showAlert, showApiError } = useAlert();

  const [plan, setPlan] = useState<Plan | null>(null);

  const [planKey, setPlanKey] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [isPublic, setIsPublic] = useState<boolean>(false);

  const [featuresEn, setFeaturesEn] = useState<string[]>([]);
  const [featuresAr, setFeaturesAr] = useState<string[]>([]);

  const [maxAnimals, setMaxAnimals] = useState("");
  const [maxAssistants, setMaxAssistants] = useState("");

  const [iosMonthly, setIosMonthly] = useState("");
  const [iosYearly, setIosYearly] = useState("");
  const [androidMonthly, setAndroidMonthly] = useState("");
  const [androidYearly, setAndroidYearly] = useState("");

  /* ---------------- FETCH PLAN ---------------- */

  const fetchPlan = async () => {
    try {
      showLoader();
      const res = await api.get(`/subscriptionPlan/${id}`);
      if (res?.data?.success) {
        const p = res.data.data;
        setPlan(p);

        setPlanKey(p.planKey || "");
        setIsPublic(!!p.isPublic);
        setNameEn(p.name_en || "");
        setNameAr(p.name_ar || "");
        setDescriptionEn(p.description_en || "");
        setDescriptionAr(p.description_ar || "");
        setFeaturesEn(p.features_en || []);
        setFeaturesAr(p.features_ar || []);
        setMaxAnimals(String(p.maxAnimals ?? ""));
        setMaxAssistants(String(p.maxAssistants ?? ""));
        setIosMonthly(p.iosProductId_monthly || "");
        setIosYearly(p.iosProductId_yearly || "");
        setAndroidMonthly(p.androidProductId_monthly || "");
        setAndroidYearly(p.androidProductId_yearly || "");
      }
    } catch (err) {
      showApiError(err);
      navigate(-1);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [id]);

  /* ---------------- UPDATE PLAN ---------------- */

  const handleUpdate = async () => {
    if (!id) return;

    try {
      showLoader();

      const payload = {
        planKey,
        name_en: nameEn,
        name_ar: nameAr,
        description_en: descriptionEn,
        description_ar: descriptionAr,
        features_en: featuresEn.filter((f) => f.trim()),
        features_ar: featuresAr.filter((f) => f.trim()),
        maxAnimals: Number(maxAnimals),
        maxAssistants: Number(maxAssistants),
        iosProductId_monthly: iosMonthly,
        iosProductId_yearly: iosYearly,
        androidProductId_monthly: androidMonthly,
        androidProductId_yearly: androidYearly,
        isPublic,
      };

      const res = await api.put(`/subscriptionPlan/${id}`, payload);

      if (res?.data?.success) {
        showAlert("success", "Subscription plan updated");
        navigate("/subscriptions/plans");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col w-full">
        <Header />
        <PageWrapper>
          <div className="px-3 sm:px-6 max-w-3xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Update Subscription Plan
              </h1>
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-sm dark:text-white"
              >
                Back
              </button>
            </div>

            {/* FORM CARD */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5">

              {/* Plan Key */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Plan Key *
                </label>
                <input
                  value={planKey}
                  onChange={(e) => setPlanKey(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              {/* Names */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Name (English)
                </label>
                <input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Name (Arabic)
                </label>
                <input
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white text-right"
                />
              </div>

              {/* Descriptions */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Description (English)
                </label>
                <textarea
                  rows={4}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Description (Arabic)
                </label>
                <textarea
                  rows={4}
                  dir="rtl"
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white text-right"
                />
              </div>

              {/* Limits */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Max Animals
                  </label>
                  <input
                    type="number"
                    value={maxAnimals}
                    onChange={(e) => setMaxAnimals(e.target.value)}
                    className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Max Assistants
                  </label>
                  <input
                    type="number"
                    value={maxAssistants}
                    onChange={(e) => setMaxAssistants(e.target.value)}
                    className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                Public Plan (visible to users)
              </label>
              
              {/* Features EN */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Features (English)
                </h2>

                {featuresEn.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={f}
                      onChange={(e) =>
                        setFeaturesEn((prev) =>
                          prev.map((x, idx) => (idx === i ? e.target.value : x))
                        )
                      }
                      className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md px-3 py-2 text-sm dark:text-white"
                    />
                    <button
                      onClick={() =>
                        setFeaturesEn((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-red-500 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setFeaturesEn((p) => [...p, ""])}
                  className="text-sm text-[#4F46E5] hover:underline"
                >
                  + Add Feature
                </button>
              </div>

              {/* Features AR */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Features (Arabic)
                </h2>

                {featuresAr.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      dir="rtl"
                      value={f}
                      onChange={(e) =>
                        setFeaturesAr((prev) =>
                          prev.map((x, idx) => (idx === i ? e.target.value : x))
                        )
                      }
                      className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md px-3 py-2 text-sm dark:text-white text-right"
                    />
                    <button
                      onClick={() =>
                        setFeaturesAr((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="text-red-500 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setFeaturesAr((p) => [...p, ""])}
                  className="text-sm text-[#4F46E5] hover:underline"
                >
                  + Add Feature
                </button>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-[#4F46E5] hover:bg-[#0000CC] text-white rounded-lg text-sm font-medium transition"
                >
                  Update Plan
                </button>
              </div>

            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
};

export default SubscriptionPlanEdit;
