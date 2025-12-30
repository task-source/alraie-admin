import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";

type ExtraInfo = {
  heading: string;
  features: string[];
};
const AddProduct: React.FC = () => {
  const MAX_IMAGES = 10;
  const { showLoader, hideLoader } = useLoader();
  const { showAlert, showApiError } = useAlert();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [extraInfos, setExtraInfos] = useState<ExtraInfo[]>([]);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [stockQty, setStockQty] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (files: File[]) => {
    setImages((prev) => {
      const merged = [...prev, ...files];
      return merged.slice(0, MAX_IMAGES);
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addExtraInfo = () => {
    setExtraInfos((prev) => [...prev, { heading: "", features: [""] }]);
  };

  const updateExtraInfoHeading = (index: number, value: string) => {
    setExtraInfos((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, heading: value } : item
      )
    );
  };

  const addFeature = (infoIndex: number) => {
    setExtraInfos((prev) =>
      prev.map((item, i) =>
        i === infoIndex
          ? { ...item, features: [...item.features, ""] }
          : item
      )
    );
  };

  const updateFeature = (
    infoIndex: number,
    featureIndex: number,
    value: string
  ) => {
    setExtraInfos((prev) =>
      prev.map((item, i) =>
        i === infoIndex
          ? {
            ...item,
            features: item.features.map((f, fi) =>
              fi === featureIndex ? value : f
            ),
          }
          : item
      )
    );
  };

  const removeFeature = (infoIndex: number, featureIndex: number) => {
    setExtraInfos((prev) =>
      prev.map((item, i) =>
        i === infoIndex
          ? {
            ...item,
            features: item.features.filter((_, fi) => fi !== featureIndex),
          }
          : item
      )
    );
  };

  const removeExtraInfo = (index: number) => {
    setExtraInfos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name || !slug || !price || !stockQty) {
      showAlert("error", "Please fill all required fields");
      return;
    }

    try {
      showLoader();

      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("currency", currency);
      formData.append("stockQty", stockQty);
      formData.append("isActive", String(isActive));
      images.forEach((img) => {
        formData.append("images", img);
      });

      extraInfos.forEach((info, infoIndex) => {
        if (!info.heading.trim()) return;

        formData.append(
          `extraInfos[${infoIndex}][heading]`,
          info.heading
        );

        info.features
          .filter((f) => f.trim())
          .forEach((feature, featureIndex) => {
            formData.append(
              `extraInfos[${infoIndex}][features][${featureIndex}]`,
              feature
            );
          });
      });

      const res = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.success) {
        showAlert("success", "Product created successfully");
        navigate("/products");
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

      <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Add Product
              </h1>

              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-sm dark:text-white"
              >
                Back
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5">

              {/* Name */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Slug *
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              {/* Price + Currency */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Price *
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value) < 0 ? "0" : e.target.value)}
                    className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                  />
                </div>

                <div className="w-32">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Currency
                  </label>
                  <input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Stock Qty *
                </label>
                <input
                  type="number"
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value) < 0 ? "0" : e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              {/* Images */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Product Images (max {MAX_IMAGES})
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`mt-2 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition
      ${isDragging
                      ? "border-[#4F46E5] bg-indigo-50 dark:bg-gray-700"
                      : "border-gray-300 dark:border-gray-600"
                    }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="product-image-upload"
                  />

                  <label
                    htmlFor="product-image-upload"
                    className="text-sm text-gray-600 dark:text-gray-300 text-center cursor-pointer"
                  >
                    <span className="font-medium text-[#4F46E5]">
                      Click to upload
                    </span>{" "}
                    or drag & drop images here
                  </label>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, JPEG up to 10 images
                  </p>
                </div>

                {/* Preview Grid */}
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((file, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-full h-32 object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm text-gray-700 dark:text-gray-300">
                    Extra Information
                  </h2>

                  <button
                    type="button"
                    onClick={addExtraInfo}
                    className="text-sm text-[#4F46E5] hover:underline"
                  >
                    + Add Section
                  </button>
                </div>

                {extraInfos.map((info, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center gap-2">
                      <input
                        placeholder="Heading"
                        value={info.heading}
                        onChange={(e) =>
                          updateExtraInfoHeading(index, e.target.value)
                        }
                        className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md px-3 py-2 text-sm dark:text-white"
                      />

                      <button
                        type="button"
                        onClick={() => removeExtraInfo(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      {info.features.map((feature, fi) => (
                        <div key={fi} className="flex gap-2">
                          <input
                            placeholder={`Feature ${fi + 1}`}
                            value={feature}
                            onChange={(e) =>
                              updateFeature(index, fi, e.target.value)
                            }
                            className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md px-3 py-2 text-sm dark:text-white"
                          />

                          <button
                            type="button"
                            onClick={() => removeFeature(index, fi)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addFeature(index)}
                      className="text-sm text-[#4F46E5] hover:underline"
                    >
                      + Add Feature
                    </button>
                  </div>
                ))}
              </div>

              {/* Active */}
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active
              </label>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className="w-full bg-[#4F46E5] hover:bg-[#0000CC] text-white py-2 rounded-lg text-sm font-medium transition"
              >
                Create Product
              </button>
            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
};

export default AddProduct;
