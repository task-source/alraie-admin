import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import Modal from "../components/Modal";
import FilterDropdown from "../components/FilterDropdown";

import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";

import { PhotoIcon } from "@heroicons/react/24/outline";
import { DataTable, DataTableColumn } from "../components/DataTable";

/* -------------------------------------------------------------------------- */
/*                              STATUS BADGES                                  */
/* -------------------------------------------------------------------------- */

const ORDER_STATUS_BADGE: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  processing:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  shipped:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  delivered:
    "bg-green-200 text-green-900 dark:bg-green-900/60 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  refunded: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface ProductDetail {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  price: number;
  currency: string;
  stockQty: number;
  isActive: boolean;
}

interface ProductOrderRow {
  _id: string;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
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

  /* ---------------- PRODUCT ORDERS STATE ---------------- */

  const [orders, setOrders] = useState<ProductOrderRow[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit] = useState(10);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);

  const [orderSearch, setOrderSearch] = useState("");
  const [debouncedOrderSearch, setDebouncedOrderSearch] = useState("");

  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [sort, setSort] = useState("");

  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* -------------------------------------------------------------------------- */
  /*                               FETCH PRODUCT                                */
  /* -------------------------------------------------------------------------- */

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
  /*                             PRODUCT ORDERS                                 */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrderSearch(orderSearch), 500);
    return () => clearTimeout(t);
  }, [orderSearch]);

  const fetchProductOrders = async () => {
    if (!product?._id) return;

    try {
      showLoader();

      const params: any = {
        productId: product._id,
        page: ordersPage,
        limit: ordersLimit,

        search: debouncedOrderSearch || undefined,
        status: orderStatus || undefined,
        paymentStatus: paymentStatus || undefined,
        paymentMethod: paymentMethod || undefined,

        minTotal: minTotal || undefined,
        maxTotal: maxTotal || undefined,

        fromDate: fromDate || undefined,
        toDate: toDate || undefined,

        sort: sort || undefined,
      };

      Object.keys(params).forEach(
        (k) => params[k] === undefined && delete params[k]
      );

      const res = await api.get("/orders/admin", { params });

      if (res?.data?.success) {
        setOrders(res.data.items || []);
        setOrdersTotalPages(res.data.totalPages || 1);
      } else {
        setOrders([]);
        setOrdersTotalPages(1);
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    if (!product?._id) return;
    fetchProductOrders();
  }, [
    product?._id,
    ordersPage,
    debouncedOrderSearch,
    orderStatus,
    paymentStatus,
    paymentMethod,
    minTotal,
    maxTotal,
    fromDate,
    toDate,
    sort,
  ]);

  useEffect(() => {
    setOrdersPage(1);
  }, [
    debouncedOrderSearch,
    orderStatus,
    paymentStatus,
    paymentMethod,
    minTotal,
    maxTotal,
    fromDate,
    toDate,
    sort,
  ]);

  /* -------------------------------------------------------------------------- */
  /*                              DELETE PRODUCT                                */
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
  /*                              PAGINATION                                    */
  /* -------------------------------------------------------------------------- */

  const renderOrdersPagination = () => {
    if (ordersTotalPages <= 1) return null;

    const current = ordersPage;
    const total = ordersTotalPages;
    const start = Math.max(1, current - 1);
    const end = Math.min(total, current + 1);

    return (
      <>
        <button
          onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
          disabled={current === 1}
          className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
        >
          Prev
        </button>

        {start > 1 && (
          <span className="px-2 text-gray-500 dark:text-gray-400">…</span>
        )}

        {Array.from({ length: end - start + 1 }).map((_, i) => {
          const page = start + i;
          return (
            <button
              key={page}
              onClick={() => setOrdersPage(page)}
              className={`px-3 py-1 rounded-md ${
                page === current
                  ? "bg-[#4F46E5] text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {page}
            </button>
          );
        })}

        {end < total && (
          <span className="px-2 text-gray-500 dark:text-gray-400">…</span>
        )}

        <button
          onClick={() => setOrdersPage((p) => Math.min(total, p + 1))}
          disabled={current === total}
          className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                              TABLE COLUMNS                                 */
  /* -------------------------------------------------------------------------- */

  const orderColumns: DataTableColumn<ProductOrderRow>[] = [
    {
      key: "_id",
      label: "Order ID",
      render: (o) => <span className="font-mono text-xs">{o._id}</span>,
    },
    {
      key: "total",
      label: "Total",
      render: (o) => `${o.total} ${o.currency}`,
    },
    {
      key: "paymentStatus",
      label: "Payment",
    },
    {
      key: "paymentMethod",
      label: "Method",
    },
    {
      key: "createdAt",
      label: "Created",
      render: (o) => new Date(o.createdAt).toLocaleString(),
    },
    {
      key: "status",
      label: "Status",
      render: (o) => (
        <span
          className={`px-2 py-0.5 text-xs rounded ${
            ORDER_STATUS_BADGE[o.status] || "bg-gray-100 dark:bg-gray-700"
          }`}
        >
          {o.status}
        </span>
      ),
    },
  ];

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 w-full max-w-full min-w-0">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">
                Product Details
              </h1>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="px-3 py-1 rounded-lg border text-sm dark:text-white"
                >
                  Back
                </button>

                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="px-3 py-1 rounded-lg border border-red-600 text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* IMAGE STRIP */}
            {product?.images?.length ? (
              <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    className="w-32 sm:w-40 h-32 sm:h-40 object-cover rounded-xl border flex-shrink-0"
                  />
                ))}
              </div>
            ) : (
              <div className="mb-8 flex items-center gap-2 text-gray-400">
                <PhotoIcon className="w-10 h-10" />
                No images available
              </div>
            )}

            {/* PRODUCT INFO */}
            {product && (
              <div className="rounded-xl border bg-white dark:bg-gray-800 p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {Object.entries({
                  Name: product.name,
                  Slug: product.slug,
                  Price: `${product.price} ${product.currency}`,
                  Stock: product.stockQty,
                  Status: product.isActive ? "Active" : "Inactive",
                }).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs uppercase text-gray-500">{k}</div>
                    <div className="text-gray-900 dark:text-white break-all">
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ORDERS */}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">
              Orders containing this product
            </h2>

            {/* FILTERS */}
            <div className="flex flex-col gap-3 mb-4 w-full">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2"
                />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <FilterDropdown
                  label="Order Status"
                  value={orderStatus}
                  onChange={setOrderStatus}
                  className="flex-1"
                  options={[
                    { label: "All", value: "" },
                    { label: "Pending", value: "pending" },
                    { label: "Paid", value: "paid" },
                    { label: "Processing", value: "processing" },
                    { label: "Shipped", value: "shipped" },
                    { label: "Delivered", value: "delivered" },
                    { label: "Cancelled", value: "cancelled" },
                    { label: "Refunded", value: "refunded" },
                  ]}
                />

                <FilterDropdown
                  label="Payment"
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  className="flex-1"
                  options={[
                    { label: "All", value: "" },
                    { label: "Pending", value: "pending" },
                    { label: "Succeeded", value: "succeeded" },
                    { label: "Failed", value: "failed" },
                    { label: "Refunded", value: "refunded" },
                  ]}
                />

                <FilterDropdown
                  label="Sort By"
                  value={sort}
                  onChange={setSort}
                  className="flex-1"
                  options={[
                    { label: "Default", value: "" },
                    { label: "Date: Latest First", value: "date_latest" },
                    { label: "Date: Oldest First", value: "date_oldest" },
                    { label: "Total: High → Low", value: "total_high_to_low" },
                    { label: "Total: Low → High", value: "total_low_to_high" },
                  ]}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  placeholder="Min Total"
                  value={minTotal}
                  onChange={(e) => setMinTotal(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Max Total"
                  value={maxTotal}
                  onChange={(e) => setMaxTotal(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="w-full overflow-x-auto">
              <DataTable<ProductOrderRow>
                data={orders}
                columns={orderColumns}
                emptyMessage="No orders found for this product"
                onRowClick={(row) => navigate(`/orders/${row._id}`)}
              />
            </div>

            {/* PAGINATION */}
            <div className="flex flex-wrap justify-center mt-4 gap-2">
              {renderOrdersPagination()}
            </div>
          </div>
        </PageWrapper>
      </main>

      {/* DELETE MODAL */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Product?"
        description="This will permanently delete this product."
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
