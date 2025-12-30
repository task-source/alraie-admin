import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { PhotoIcon } from "@heroicons/react/24/outline";

interface ExtraInfo {
  heading: string;
  features: string[];
}
interface Product {
  _id: string;
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  description_ar?: string;
  price: number;
  currency: string;
  stockQty: number;
  isActive: boolean;
  images: string[];
  extraInfos?: ExtraInfo[];
  extraInfos_ar?: ExtraInfo[];
}

const MAX_IMAGES = 10;

const ProductEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { showAlert, showApiError } = useAlert();

  const [product, setProduct] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [extraInfos, setExtraInfos] = useState<ExtraInfo[]>([]);
  const [extraInfosAr, setExtraInfosAr] = useState<ExtraInfo[]>([]);
  const [stockQty, setStockQty] = useState("");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [replaceImages, setReplaceImages] = useState(false);

  /* ---------------- FETCH PRODUCT ---------------- */

  const fetchProduct = async () => {
    try {
      showLoader();
      const res = await api.get(`/products/${id}`);
      if (res?.data?.success) {
        const p = res.data.data;
        setProduct(p);
        setName(p.name);
        setNameAr(p.name_ar);
        setSlug(p.slug);
        setDescription(p.description || "");
        setDescriptionAr(p.description_ar || "");
        setPrice(String(p.price));
        setCurrency(p.currency);
        setStockQty(String(p.stockQty));
        setExistingImages(p.images || []);
        setExtraInfos(p.extraInfos || []);
        setExtraInfosAr(p.extraInfos_ar || []);
      }
    } catch (err) {
      showApiError(err);
      navigate(-1);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  /* ---------------- IMAGE HANDLING ---------------- */

  const handleAddImages = (files: FileList | null) => {
    if (!files) return;

    const remaining =
      MAX_IMAGES -
      (replaceImages ? 0 : existingImages.length - imagesToDelete.length) -
      newImages.length;

    const selected = Array.from(files).slice(0, remaining);
    setNewImages((prev) => [...prev, ...selected]);
  };

  const toggleDeleteExisting = (url: string) => {
    setImagesToDelete((prev) =>
      prev.includes(url) ? prev.filter((i) => i !== url) : [...prev, url]
    );
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
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

  const removeFeatureAr = (infoIndex: number, featureIndex: number) => {
    setExtraInfosAr((prev) =>
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
  /* ---------------- UPDATE PRODUCT ---------------- */

  const handleUpdate = async () => {
    if (!id) return;

    try {
      showLoader();

      const form = new FormData();
      form.append("name", name);
      form.append("name_ar", nameAr);
      // form.append("slug", slug);
      form.append("description", description);
      form.append("description_ar", descriptionAr);
      form.append("price", price);
      form.append("currency", currency);
      form.append("stockQty", stockQty);
      form.append("replaceImages", String(replaceImages));

      if (imagesToDelete.length > 0) {
        form.append("imagesToDelete", JSON.stringify(imagesToDelete));
      }

      newImages.forEach((file) => {
        form.append("images", file);
      });

      extraInfos.forEach((info, infoIndex) => {
        if (!info.heading.trim()) return;

        form.append(
          `extraInfos[${infoIndex}][heading]`,
          info.heading
        );

        info.features
          .filter((f) => f.trim())
          .forEach((feature, featureIndex) => {
            form.append(
              `extraInfos[${infoIndex}][features][${featureIndex}]`,
              feature
            );
          });
      });

      extraInfosAr.forEach((info, infoIndex) => {
        if (!info.heading.trim()) return;

        form.append(
          `extraInfos_ar[${infoIndex}][heading]`,
          info.heading
        );

        info.features
          .filter((f) => f.trim())
          .forEach((feature, featureIndex) => {
            form.append(
              `extraInfos_ar[${infoIndex}][features][${featureIndex}]`,
              feature
            );
          });
      });

      const res = await api.put(`/products/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.success) {
        showAlert("success", "Product updated");
        navigate(`/products/${id}`);
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
                Update Product
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

              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Name (Arabic)*
                </label>
                <input
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>
              {/* Slug */}
              {/* <div>
        <label className="text-sm text-gray-700 dark:text-gray-300">
          Slug *
        </label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
        />
      </div> */}

              {/* Description */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Description (Arabic)
                </label>
                <textarea
                  rows={4}
                  value={descriptionAr}
                  dir="rtl"
                  onChange={(e) => setDescriptionAr(e.target.value)}
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
                    onChange={(e) => setPrice(e.target.value)}
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
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm dark:text-white"
                />
              </div>

              {/* EXISTING IMAGES */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Existing Images
                </label>

                {existingImages.length === 0 ? (
                  <div className="mt-2 flex items-center gap-2 text-gray-400">
                    <PhotoIcon className="w-6 h-6" />
                    No images uploaded
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {existingImages.map((img) => (
                      <div
                        key={img}
                        className={`relative group rounded-lg overflow-hidden border dark:border-gray-700 ${imagesToDelete.includes(img) ? "opacity-40" : ""
                          }`}
                      >
                        <img
                          src={img}
                          className="w-full h-32 object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => toggleDeleteExisting(img)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ADD NEW IMAGES */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Add Images (max {MAX_IMAGES})
                </label>

                <div
                  className="mt-2 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition
          border-gray-300 dark:border-gray-600 hover:border-[#4F46E5]"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleAddImages(e.target.files)}
                    className="hidden"
                    id="edit-product-upload"
                  />

                  <label
                    htmlFor="edit-product-upload"
                    className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer"
                  >
                    <span className="font-medium text-[#4F46E5]">
                      Click to upload
                    </span>{" "}
                    or drag & drop images here
                  </label>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, JPEG
                  </p>
                </div>

                {newImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {newImages.map((file, i) => (
                      <div
                        key={i}
                        className="relative group rounded-lg overflow-hidden border dark:border-gray-700"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          onClick={() => removeNewImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Replace Toggle */}
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={replaceImages}
                  onChange={(e) => setReplaceImages(e.target.checked)}
                />
                Replace all existing images
              </label>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
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
                    <div className="flex gap-2 items-center">
                      <input
                        value={info.heading}
                        placeholder="Heading"
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

                    {info.features.map((feature, fi) => (
                      <div key={fi} className="flex gap-2">
                        <input
                          value={feature}
                          placeholder={`Feature ${fi + 1}`}
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

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm text-gray-700 dark:text-gray-300">
                    Extra Information (Arabic)
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      setExtraInfosAr((prev) => [...prev, { heading: "", features: [""] }])
                    }
                    className="text-sm text-[#4F46E5] hover:underline"
                  >
                    + Add Section
                  </button>
                </div>

                {extraInfosAr.map((info, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex gap-2 items-center">
                      <input
                        dir="rtl"
                        placeholder="العنوان"
                        value={info.heading}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExtraInfosAr((prev) =>
                            prev.map((item, i) =>
                              i === index ? { ...item, heading: v } : item
                            )
                          );
                        }}
                        className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md px-3 py-2 text-sm dark:text-white text-right"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setExtraInfosAr((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    {info.features.map((feature, fi) => (
                      <div key={fi} className="flex gap-2">
                        <input
                          dir="rtl"
                          placeholder={`الميزة ${fi + 1}`}
                          value={feature}
                          onChange={(e) => {
                            const v = e.target.value;
                            setExtraInfosAr((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                    ...item,
                                    features: item.features.map((f, fidx) =>
                                      fidx === fi ? v : f
                                    ),
                                  }
                                  : item
                              )
                            );
                          }}
                          className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md px-3 py-2 text-sm dark:text-white text-right"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeatureAr(index, fi)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setExtraInfosAr((prev) =>
                          prev.map((item, i) =>
                            i === index
                              ? { ...item, features: [...item.features, ""] }
                              : item
                          )
                        )
                      }
                      className="text-sm text-[#4F46E5] hover:underline"
                    >
                      + Add Feature
                    </button>
                  </div>
                ))}
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
                  Update Product
                </button>
              </div>
            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
};

export default ProductEdit;
