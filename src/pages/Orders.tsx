import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { FiSearch } from "react-icons/fi";
import Modal from "../components/Modal";
import FilterDropdown from "../components/FilterDropdown";
import { useNavigate } from "react-router-dom";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

interface OrderRow {
  _id: string;
  userId: string;
  items: {
    productName: string;
    productImage?: string;
    unitPrice: number;
    quantity: number;
    currency: string;
  }[];
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { showApiError, showAlert } = useAlert();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /* ---------------- FILTER STATE ---------------- */
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currency, setCurrency] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState("date_latest");

  /* ---------------- DEBOUNCED ---------------- */
  const [dSearch, setDSearch] = useState("");
  const [dProductId, setDProductId] = useState("");
  const [dMinTotal, setDMinTotal] = useState("");
  const [dMaxTotal, setDMaxTotal] = useState("");
  const [dCurrency, setDCurrency] = useState("");

  /* ---------------- STATUS UPDATE ---------------- */
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);

  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [modalProducts, setModalProducts] = useState<OrderRow["items"]>([]);
  const [modalOrderId, setModalOrderId] = useState<string>("");
  /* ---------------- DEBOUNCE ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setDSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDProductId(productId), 500);
    return () => clearTimeout(t);
  }, [productId]);

  useEffect(() => {
    const t = setTimeout(() => setDMinTotal(minTotal), 500);
    return () => clearTimeout(t);
  }, [minTotal]);

  useEffect(() => {
    const t = setTimeout(() => setDMaxTotal(maxTotal), 500);
    return () => clearTimeout(t);
  }, [maxTotal]);

  useEffect(() => {
    const t = setTimeout(() => setDCurrency(currency), 500);
    return () => clearTimeout(t);
  }, [currency]);

  /* ---------------- FETCH ---------------- */
  const fetchOrders = async () => {
    try {
      showLoader();

      const params: any = {
        page,
        limit,
        search: dSearch || undefined,
        productId: dProductId || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        currency: dCurrency || undefined,
        minTotal: dMinTotal || undefined,
        maxTotal: dMaxTotal || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sort,
      };

      Object.keys(params).forEach(
        (k) => params[k] === undefined && delete params[k]
      );

      const res = await api.get("/orders/admin", { params });

      if (res?.data?.success) {
        setOrders(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setOrders([]);
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  /* reset page */
  useEffect(() => {
    setPage(1);
  }, [
    dSearch,
    dProductId,
    dMinTotal,
    dMaxTotal,
    dCurrency,
    status,
    paymentStatus,
    paymentMethod,
    fromDate,
    toDate,
    sort,
  ]);

  /* auto fetch */
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    dSearch,
    dProductId,
    dMinTotal,
    dMaxTotal,
    dCurrency,
    status,
    paymentStatus,
    paymentMethod,
    fromDate,
    toDate,
    sort,
  ]);

  /* ---------------- COLUMNS ---------------- */
  const columns: DataTableColumn<OrderRow>[] = [
    { key: "_id", label: "Order ID", render: (r) => r._id },
    {
      key: "products",
      label: "Products",
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setModalProducts(r.items);
            setModalOrderId(r._id);
            setProductsModalOpen(true);
          }}
          className="px-3 py-1 rounded-md text-sm font-medium
                     bg-[#4F46E5] text-white hover:bg-[#0000CC] transition"
        >
          View Products ({r.items.length})
        </button>
      ),
    },

    { key: "total", label: "Total", render: (r) => `${r.total} ${r.currency}` },
    { key: "paymentStatus", label: "Payment" },
    { key: "paymentMethod", label: "Method" },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:text-black">
          {r.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At (UTC)",
      render: (r) =>
        new Date(r.createdAt).toLocaleString(undefined, {
          timeZone: "UTC",
        }),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => {
        const next = STATUS_TRANSITIONS[r.status];
        return (
          <select
            disabled={!next.length}
            onChange={(e) => {
              setSelectedOrder(r);
              setNextStatus(e.target.value as OrderStatus);
              setConfirmModalOpen(true);
            }}
            className="border rounded-md px-2 py-1 text-xs dark:text-black"
          >
            <option value="">Change</option>
            {next.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        );
      },
    },
  ];

  const renderPagination = () => {
    if (totalPages <= 1) return null;
  
    const current = page;
    const total = totalPages;
  
    const start = Math.max(1, current - 1);
    const end = Math.min(total, current + 1);
  
    return (
      <div className="flex flex-wrap justify-center items-center mt-6 gap-2">
        {/* Prev */}
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={current === 1}
          className={`px-3 py-1 rounded-md text-sm font-medium transition
            ${
              current === 1
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
        >
          Prev
        </button>
  
        {/* Leading ellipsis */}
        {start > 1 && (
          <>
            <button
              onClick={() => setPage(1)}
              className="px-3 py-1 rounded-md text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              1
            </button>
            {start > 2 && <span className="px-2 text-gray-400">…</span>}
          </>
        )}
  
        {/* Page numbers */}
        {Array.from({ length: end - start + 1 }).map((_, i) => {
          const p = start + i;
          return (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  p === current
                    ? "bg-[#4F46E5] text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
            >
              {p}
            </button>
          );
        })}
  
        {/* Trailing ellipsis */}
        {end < total && (
          <>
            {end < total - 1 && <span className="px-2 text-gray-400">…</span>}
            <button
              onClick={() => setPage(total)}
              className="px-3 py-1 rounded-md text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {total}
            </button>
          </>
        )}
  
        {/* Next */}
        <button
           onClick={() => setPage((p) => Math.min(total, p + 1))}
          disabled={current === total}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
              current === total
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Next
        </button>
      </div>
      );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      {/* IMPORTANT: min-w-0 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header />

        <PageWrapper>
          {/* IMPORTANT: min-w-0 */}
          <div className="px-3 sm:px-6 w-full min-w-0 overflow-x-hidden">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
              Orders
            </h1>

            {/* FILTERS */}
            <div className="flex flex-col gap-3 mb-6 w-full">
              {/* SEARCH + PRODUCT ID */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="relative flex-1 min-w-0">
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search order ID / product name"
                    className="w-full border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-gray-800 text-sm rounded-lg
                               px-10 py-2 focus:ring-2 focus:ring-[#4F46E5]
                               outline-none text-gray-800 dark:text-white"
                  />
                </div>

                <input
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="Product ID"
                  className="flex-1 min-w-0 border border-gray-300 dark:border-gray-700
                             bg-white dark:bg-gray-800 text-sm rounded-lg
                             px-3 py-2 text-gray-800 dark:text-white"
                />
              </div>

              {/* DROPDOWNS */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <FilterDropdown
                  label="Order Status"
                  value={status}
                  onChange={setStatus}
                  className="flex-1 min-w-0"
                  options={[
                    { label: "All Order Status", value: "" },
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
                  label="Payment Status"
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  className="flex-1 min-w-0"
                  options={[
                    { label: "All Payment Status", value: "" },
                    { label: "Pending", value: "pending" },
                    { label: "Succeeded", value: "succeeded" },
                    { label: "Failed", value: "failed" },
                    { label: "Refunded", value: "refunded" },
                  ]}
                />

                <FilterDropdown
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  className="flex-1 min-w-0"
                  options={[
                    { label: "All Payment Method", value: "" },
                    { label: "Card", value: "card" },
                    { label: "Apple Pay", value: "applePay" },
                  ]}
                />
                <FilterDropdown
                  label="Sort"
                  value={sort}
                  onChange={setSort}
                  className="flex-1 min-w-0"
                  options={[
                    { label: "Date: Latest First", value: "date_latest" },
                    { label: "Date: Oldest First", value: "date_oldest" },
                    { label: "Total: High → Low", value: "total_high_to_low" },
                    { label: "Total: Low → High", value: "total_low_to_high" },
                  ]}
                />
              </div>

              {/* TOTAL + DATE */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <input
                  className="flex-1 min-w-0 border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
                  value={minTotal}
                  onChange={(e) => setMinTotal(e.target.value)}
                  placeholder="Min Total"
                />

                <input
                  className="flex-1 min-w-0 border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white"
                  value={maxTotal}
                  onChange={(e) => setMaxTotal(e.target.value)}
                  placeholder="Max Total"
                />

                <input
                  type="date"
                  className="flex-1 min-w-0 border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white appearance-none"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />

                <input
                  type="date"
                  className="flex-1 min-w-0 border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white appearance-none"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            {/* TABLE — CRITICAL FIX */}
            <div className="w-full overflow-x-auto">
              <DataTable<OrderRow>
                data={orders}
                columns={columns}
                onRowClick={(row) => navigate(`/orders/${row._id}`)}
                emptyMessage="No orders found"
              />
            </div>

            {/* PAGINATION */}
            <div className="flex flex-wrap justify-center mt-6 gap-2">
              {renderPagination()}
            </div>
          </div>

          {/* PRODUCTS MODAL */}
          {productsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
              <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6
                              w-full max-w-4xl border border-gray-200 dark:border-gray-700
                              max-h-[90vh] overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Products — Order #{modalOrderId}
                  </h2>
                  <button
                    onClick={() => setProductsModalOpen(false)}
                    className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700
                               text-gray-700 dark:text-gray-200"
                  >
                    Close
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[70vh]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {modalProducts.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 p-3 rounded-lg border
                                   border-gray-200 dark:border-gray-700
                                   bg-gray-50 dark:bg-gray-900"
                      >
                        {/* unchanged product card */}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </PageWrapper>
      </main>

      {/* CONFIRM MODAL — unchanged */}
      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Update Order Status?"
        description={`Change order status to "${nextStatus}"?`}
        confirmText="Yes, Update"
        cancelText="Cancel"
        confirmColor="primary"
        onConfirm={async () => {
          if (!selectedOrder || !nextStatus) return;
          await api.patch(`/orders/${selectedOrder._id}/status`, {
            status: nextStatus,
          });
          showAlert("success", "Order status updated");
          setConfirmModalOpen(false);
          fetchOrders();
        }}
      />
    </div>
  );
};

export default Orders;
