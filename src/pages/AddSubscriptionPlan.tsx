import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";

const AddSubscriptionPlan: React.FC = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showAlert, showApiError } = useAlert();
  const navigate = useNavigate();

  const [planKey, setPlanKey] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");

  const [featuresEn, setFeaturesEn] = useState<string[]>([""]);
  const [featuresAr, setFeaturesAr] = useState<string[]>([""]);

  const [maxAnimals, setMaxAnimals] = useState("");
  const [maxAssistants, setMaxAssistants] = useState("");

  const [iosMonthly, setIosMonthly] = useState("");
  const [iosYearly, setIosYearly] = useState("");
  const [androidMonthly, setAndroidMonthly] = useState("");
  const [androidYearly, setAndroidYearly] = useState("");

  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async () => {
    if (!planKey || !nameEn || !nameAr) {
      showAlert("error", "Please fill all required fields");
      return;
    }

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

      const res = await api.post("/subscriptionPlan", payload);

      if (res?.data?.success) {
        showAlert("success", "Subscription plan created");
        navigate("/subscriptions/plans");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const badge = (ok: boolean, text: string) => (
    <span
      className={`text-xs px-2 py-0.5 rounded-md ${
        ok ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {text}
    </span>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Create Subscription Plan
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
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  Plan Key *{badge(!!planKey, planKey ? "Valid" : "Required")}
                </label>
                <input
                  value={planKey}
                  onChange={(e) => setPlanKey(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              {/* Names */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  Name (English) *{badge(!!nameEn, nameEn ? "OK" : "Required")}
                </label>
                <input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  Name (Arabic) *{badge(!!nameAr, nameAr ? "OK" : "Required")}
                </label>
                <input
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white text-right"
                />
              </div>

              {/* Descriptions */}
              <textarea
                rows={4}
                placeholder="Description (English)"
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
              />

              <textarea
                rows={4}
                dir="rtl"
                placeholder="الوصف (Arabic)"
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white text-right"
              />

              {/* Limits */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  placeholder="Max Animals"
                  value={maxAnimals}
                  onChange={(e) => setMaxAnimals(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Max Assistants"
                  value={maxAssistants}
                  onChange={(e) => setMaxAssistants(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Platform IDs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Apple (iOS)
                  </h3>
                  <input
                    placeholder="Monthly Product ID"
                    value={iosMonthly}
                    onChange={(e) => setIosMonthly(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
                  />
                  <input
                    placeholder="Yearly Product ID"
                    value={iosYearly}
                    onChange={(e) => setIosYearly(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Google Play (Android)
                  </h3>
                  <input
                    placeholder="Monthly Product ID"
                    value={androidMonthly}
                    onChange={(e) => setAndroidMonthly(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
                  />
                  <input
                    placeholder="Yearly Product ID"
                    value={androidYearly}
                    onChange={(e) => setAndroidYearly(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Features (English)
                  </h2>

                  <button
                    type="button"
                    onClick={() => setFeaturesEn((prev) => [...prev, ""])}
                    className="text-sm text-[#4F46E5] hover:underline"
                  >
                    + Add Feature
                  </button>
                </div>

                {featuresEn.length === 0 && (
                  <p className="text-xs text-gray-400">No features added</p>
                )}

                {featuresEn.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      placeholder={`Feature ${index + 1}`}
                      value={feature}
                      onChange={(e) =>
                        setFeaturesEn((prev) =>
                          prev.map((f, i) => (i === index ? e.target.value : f))
                        )
                      }
                      className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md px-3 py-2 text-sm dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setFeaturesEn((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Features (Arabic)
                  </h2>

                  <button
                    type="button"
                    onClick={() => setFeaturesAr((prev) => [...prev, ""])}
                    className="text-sm text-[#4F46E5] hover:underline"
                  >
                    + Add Feature
                  </button>
                </div>

                {featuresAr.length === 0 && (
                  <p className="text-xs text-gray-400 text-right">
                    لا توجد ميزات
                  </p>
                )}

                {featuresAr.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      dir="rtl"
                      placeholder={`الميزة ${index + 1}`}
                      value={feature}
                      onChange={(e) =>
                        setFeaturesAr((prev) =>
                          prev.map((f, i) => (i === index ? e.target.value : f))
                        )
                      }
                      className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md px-3 py-2 text-sm dark:text-white text-right"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setFeaturesAr((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {/* Public */}
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                Public plan (visible to users)
              </label>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className="w-full bg-[#4F46E5] hover:bg-[#0000CC] text-white py-2 rounded-lg text-sm font-medium transition"
              >
                Create Subscription Plan
              </button>
            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
};

export default AddSubscriptionPlan;
