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
  items: { productName: string }[];
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
  const { showLoader, hideLoader } = useLoader();
  const { showApiError, showAlert } = useAlert();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /* ---------------- FILTER STATES ---------------- */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currency, setCurrency] = useState("");

  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [productId, setProductId] = useState("");
  
  const [sort, setSort] = useState("date_latest");

  /* ---------------- STATUS UPDATE ---------------- */
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);

  /* ---------------- DEBOUNCE ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  /* ---------------- FETCH ORDERS ---------------- */
  const fetchOrders = async () => {
    try {
      showLoader();
      const params: any = {
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        currency: currency || undefined,
        minTotal: minTotal || undefined,
        maxTotal: maxTotal || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        productId: productId || undefined,
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

  /* reset page on filters */
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    status,
    paymentStatus,
    paymentMethod,
    currency,
    minTotal,
    maxTotal,
    fromDate,
    toDate,
    sort,
  ]);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    debouncedSearch,
    status,
    paymentStatus,
    paymentMethod,
    currency,
    minTotal,
    maxTotal,
    fromDate,
    toDate,
    sort,
  ]);

  /* ---------------- UPDATE STATUS ---------------- */
  const confirmStatusChange = async () => {
    if (!selectedOrder || !nextStatus) return;

    try {
      showLoader();
      await api.patch(`/orders/${selectedOrder._id}/status`, {
        status: nextStatus,
      });
      showAlert("success", "Order status updated");
      fetchOrders();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setConfirmModalOpen(false);
      setSelectedOrder(null);
      setNextStatus(null);
    }
  };

  /* ---------------- COLUMNS ---------------- */
  const columns: DataTableColumn<OrderRow>[] = [
    {
      key: "_id",
      label: "Order ID",
      render: (r) => r._id.slice(-8),
    },
    {
      key: "items",
      label: "Items",
      render: (r) => r.items.length,
    },
    {
      key: "total",
      label: "Total",
      render: (r) => `${r.total} ${r.currency}`,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded-md font-medium ${
            r.status === "delivered"
              ? "bg-green-100 text-green-800"
              : r.status === "cancelled"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {r.status}
        </span>
      ),
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
        const next = STATUS_TRANSITIONS[r.status] || [];
        return (
          <select
            disabled={next.length === 0}
            onChange={(e) => {
              setSelectedOrder(r);
              setNextStatus(e.target.value as OrderStatus);
              setConfirmModalOpen(true);
            }}
            className="border rounded-md px-2 py-1 text-xs dark:bg-gray-800 dark:text-white disabled:opacity-50"
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

  /* ---------------- PAGINATION ---------------- */
  const renderPaginationButtons = () => {
    const buttons = [];
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

    buttons.push(
      <button
        key="prev"
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={page === 1}
        className={`px-3 py-1 rounded-md text-sm ${
          page === 1
            ? "bg-gray-300 dark:bg-gray-700 text-gray-500"
            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        Prev
      </button>
    );

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 rounded-md text-sm ${
            page === i
              ? "bg-[#4F46E5] text-white"
              : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          {i}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={page === totalPages}
        className={`px-3 py-1 rounded-md text-sm ${
          page === totalPages
            ? "bg-gray-300 dark:bg-gray-700 text-gray-500"
            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        Next
      </button>
    );

    return buttons;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
              Orders
            </h1>

            {/* FILTERS */}
<div className="flex flex-col gap-3 mb-4">

  {/* SEARCH + PRODUCT ID */}
  <div className="flex flex-wrap gap-3">
    <div className="relative flex-1 min-w-[220px]">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search order ID / product name"
        className="w-full border rounded-lg px-10 py-2 text-sm
                   dark:bg-gray-800 dark:text-white"
      />
      <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
    </div>

    <input
      value={productId}
      onChange={(e) => setProductId(e.target.value)}
      placeholder="Product ID"
      className="border rounded-lg px-3 py-2 text-sm
                 dark:bg-gray-800 dark:text-white"
    />
  </div>

  {/* DROPDOWNS */}
  <div className="flex flex-wrap gap-3">
    <FilterDropdown
      label="Order Status"
      value={status}
      onChange={setStatus}
      options={[
        { label: "All Status", value: "" },
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
      options={[
        { label: "All Methods", value: "" },
        { label: "Card", value: "card" },
        { label: "COD", value: "cod" },
        { label: "PayPal", value: "paypal" },
        { label: "KNET", value: "knet" },
      ]}
    />

    <FilterDropdown
      label="Sort"
      value={sort}
      onChange={setSort}
      options={[
        { label: "Latest", value: "date_latest" },
        { label: "Oldest", value: "date_oldest" },
        { label: "Total High → Low", value: "total_high_to_low" },
        { label: "Total Low → High", value: "total_low_to_high" },
      ]}
    />
  </div>

  {/* TOTAL + DATE */}
  <div className="flex flex-wrap gap-3">
    <input
      placeholder="Min Total"
      value={minTotal}
      onChange={(e) => setMinTotal(e.target.value)}
      className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
    />
    <input
      placeholder="Max Total"
      value={maxTotal}
      onChange={(e) => setMaxTotal(e.target.value)}
      className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
    />

    <input
      type="date"
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
      className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
    />
    <input
      type="date"
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
      className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
    />
  </div>
</div>

            <DataTable<OrderRow>
              data={orders}
              columns={columns}
              emptyMessage="No orders found"
            />

            <div className="flex justify-center mt-5 gap-2">
              {renderPaginationButtons()}
            </div>
          </div>
        </PageWrapper>
      </main>

      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Update Order Status?"
        description={`Change order status to "${nextStatus}"?`}
        confirmText="Yes, Update"
        cancelText="Cancel"
        confirmColor="primary"
        onConfirm={confirmStatusChange}
      />
    </div>
  );
};

export default Orders;
