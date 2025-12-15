import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import Modal from "../components/Modal";

import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";

import { PhotoIcon } from "@heroicons/react/24/outline";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface ProductDetail {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  images?: string[];
  price: number;
  currency: string;
  stockQty: number;
  isActive: boolean;
  categoryId?: string | null;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

const ProductDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { showLoader, hideLoader } = useLoader();
  const { showApiError, showAlert } = useAlert();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                               FETCH PRODUCT                                */
  /* -------------------------------------------------------------------------- */

  const handleToggleActive = async () => {
    if (!product) return;
  
    try {
      showLoader();
      const endpoint = product.isActive ? "deactivate" : "activate";
      const res = await api.put(`/products/${product._id}/${endpoint}`);
  
      if (res?.data?.success) {
        showAlert(
          "success",
          `Product ${product.isActive ? "deactivated" : "activated"}`
        );
        fetchProduct(); // refresh details
      } else {
        showAlert("error", "Action failed");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };
  
  const fetchProduct = async () => {
    if (!id) return;
    try {
      showLoader();
      const res = await api.get(`/products/${id}`);
      if (res?.data?.success) {
        setProduct(res.data.data);
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

  /* -------------------------------------------------------------------------- */
  /*                               DELETE PRODUCT                                */
  /* -------------------------------------------------------------------------- */

  const handleDeleteProduct = async () => {
    if (!id) return;
    try {
      showLoader();
      const res = await api.delete(`/products/${id}`);
      if (res?.data?.success) {
        showAlert("success", "Product deleted");
        navigate("/products");
      } else {
        showAlert("error", "Delete failed");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col w-full">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 w-full max-w-full">
            {/* --------------------------------------------------------- */}
            {/* HEADER */}
            {/* --------------------------------------------------------- */}

            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">
                Product Details
              </h1>

              <div className="flex gap-2">
  <button
    onClick={() => navigate(-1)}
    className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
  >
    Back
  </button>

  <button
    onClick={handleToggleActive}
    className={`px-3 py-1 rounded-lg border text-sm ${
      product?.isActive
        ? "border-yellow-600 text-yellow-700 hover:bg-yellow-50"
        : "border-green-600 text-green-700 hover:bg-green-50"
    }`}
  >
    {product?.isActive ? "Deactivate" : "Activate"}
  </button>

  <button
  onClick={() => navigate(`/products/${product?._id}/edit`)}
  className="px-3 py-1 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 text-sm"
>
  Update
</button>

  <button
    onClick={() => setDeleteModalOpen(true)}
    className="px-3 py-1 rounded-lg border border-red-600 text-red-600 text-sm hover:bg-red-50"
  >
    Delete
  </button>
</div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* IMAGE STRIP */}
            {/* --------------------------------------------------------- */}

            {product?.images?.length ? (
              <div className="mb-8 w-full overflow-x-auto whitespace-nowrap no-scrollbar">
                <div className="flex gap-3">
                  {product.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      className="w-40 h-40 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-8 flex items-center gap-3 text-gray-400">
                <PhotoIcon className="w-10 h-10" />
                No images available
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* PRODUCT DETAILS CARD */}
            {/* --------------------------------------------------------- */}

            {product && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {Object.entries({
                  Name: product.name,
                  Slug: product.slug,
                  Price: `${product.price} ${product.currency}`,
                  Stock: product.stockQty,
                  Status: product.isActive ? "Active" : "Inactive",
                  Category: product.categoryId ?? "—",
                  Created: product.createdAt
                    ? new Date(product.createdAt).toLocaleString()
                    : "—",
                  Updated: product.updatedAt
                    ? new Date(product.updatedAt).toLocaleString()
                    : "—",
                }).map(([label, val]) => (
                  <div key={label}>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      {label}
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 break-all">
                      {val ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* DESCRIPTION */}
            {/* --------------------------------------------------------- */}

            {product?.description && (
              <div className="mb-8 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
                <div className="font-semibold text-gray-800 dark:text-white mb-2">
                  Description
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {product.description}
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* METADATA */}
            {/* --------------------------------------------------------- */}

            {product?.metadata && Object.keys(product.metadata).length > 0 && (
              <div className="mb-12 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
                <div className="font-semibold text-gray-800 dark:text-white mb-2">
                  Metadata
                </div>
                <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                  {JSON.stringify(product.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </PageWrapper>
      </main>

      {/* --------------------------------------------------------- */}
      {/* DELETE MODAL */}
      {/* --------------------------------------------------------- */}

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Product?"
        description="This will permanently delete this product and all associated images. Are you sure?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={() => {
          setDeleteModalOpen(false);
          handleDeleteProduct();
        }}
      />
    </div>
  );
};

export default ProductDetails;
