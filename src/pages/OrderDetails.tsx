import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";
import { PhotoIcon } from "@heroicons/react/24/outline";

/* -------------------------------------------------------------------------- */
/*                               STATUS CONFIG                                 */
/* -------------------------------------------------------------------------- */

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
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

interface OrderItem {
  productId: {
    _id: string;
    isActive?: boolean;
  };
  productName: string;
  productImage?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  currency: string;
}

interface OrderDetails {
  _id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

interface UserDetails {
  _id: string;
  email?: string;
  name?: string;
  profileImage?: string;
}

/* -------------------------------------------------------------------------- */
/*                           IMAGE FALLBACK                                   */
/* -------------------------------------------------------------------------- */

const ImageWithFallback: React.FC<{ src?: string }> = ({ src }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-12 h-12 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <PhotoIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      onError={() => setFailed(true)}
      className="w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-gray-700"
      alt="product"
    />
  );
};

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { showApiError, showAlert } = useAlert();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [user, setUser] = useState<UserDetails | null>(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  /* -------------------------------------------------------------------------- */
  /*                                 FETCH DATA                                 */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        showLoader();
        const res = await api.get(`/orders/${id}`);
        if (res?.data?.success) {
          setOrder(res.data.data);
        } else {
          showAlert("error", "Order not found");
          navigate(-1);
        }
      } catch (err) {
        showApiError(err);
      } finally {
        hideLoader();
      }
    };

    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!order?.userId) return;

    const fetchUser = async () => {
      try {
        const res = await api.get(`/admin/user/${order.userId}`);
        if (res?.data?.success) {
          setUser(res.data.data.user);
        }
      } catch (err) {
        showApiError(err);
      }
    };

    fetchUser();
  }, [order?.userId]);

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */

  if (!order) return null;

  const allowedNext = ORDER_STATUS_TRANSITIONS[order.status] || [];

  const productColumns: DataTableColumn<OrderItem>[] = [
    {
      key: "image",
      label: "Image",
      render: (i) => <ImageWithFallback src={i.productImage} />,
    },
    { key: "productName", label: "Product" },
    { key: "quantity", label: "Qty" },
    {
      key: "unitPrice",
      label: "Unit Price",
      render: (i) => `${i.unitPrice} ${i.currency}`,
    },
    {
      key: "lineTotal",
      label: "Total",
      render: (i) => `${i.lineTotal} ${i.currency}`,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      {/* IMPORTANT: min-w-0 */}
      <main className="flex-1 flex flex-col min-w-0">
        <Header />

        <PageWrapper>
          {/* IMPORTANT: min-w-0 */}
          <div className="px-3 sm:px-6 min-w-0">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">
                Order Details
              </h1>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
                >
                  Back
                </button>

                <button
                  disabled={allowedNext.length === 0}
                  onClick={() => setStatusModalOpen(true)}
                  className={`px-3 py-1 rounded-lg border text-sm transition
                    ${
                      allowedNext.length === 0
                        ? "border-gray-400 text-gray-400 cursor-not-allowed"
                        : "border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white"
                    }`}
                >
                  Change Status
                </button>
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div className="rounded-xl border bg-white dark:bg-gray-800 p-4 sm:p-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  ["Order ID", order._id],
                  [
                    "Status",
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        STATUS_BADGE_CLASSES[order.status]
                      }`}
                    >
                      {order.status}
                    </span>,
                  ],
                  [
                    "Payment",
                    `${order.paymentStatus} (${order.paymentMethod})`,
                  ],
                  ["Total", `${order.total} ${order.currency}`],
                  ["Created", new Date(order.createdAt).toLocaleString()],
                  ["Updated", new Date(order.updatedAt).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-xs uppercase text-gray-500">
                      {label}
                    </div>
                    <div className="break-all text-gray-900 dark:text-gray-100">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* USER */}
            {user && (
              <div
                onClick={() => navigate(`/user/${user._id}`)}
                className="cursor-pointer mb-8 rounded-xl border bg-white dark:bg-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                  User
                </h2>
                <div className="flex items-center gap-4 mb-2">
                <div className="overflow-x-auto whitespace-nowrap no-scrollbar">
                    <ImageWithFallback
                      src={user.profileImage}
                    />
                  </div>
                <div className="text-sm text-gray-800 dark:text-gray-100 break-all">
                  <div>{user.name || "—"}</div>
                  <div>{user.email || "—"}</div>
                  <div className="text-xs text-gray-500">{user._id}</div>
                </div>
                </div>
              </div>
            )}

            {/* PRODUCTS */}
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
              Products
            </h2>

            {/* IMPORTANT: overflow wrapper */}
            <div className="w-full overflow-x-auto">
              <DataTable<OrderItem>
                data={order.items}
                columns={productColumns}
                onRowClick={(row) => navigate(`/products/${row.productId._id}`)}
                emptyMessage="No products in this order"
              />
            </div>

            {/* PRICE */}
            <div className="mt-8 max-w-md rounded-xl border bg-white dark:bg-gray-800 p-4">
              {[
                ["Subtotal", order.subtotal],
                ["Shipping", order.shippingFee],
                ["Tax", order.taxAmount],
                ["Total", `${order.total} ${order.currency}`],
              ].map(([l, v]) => (
                <div
                  key={l as string}
                  className="flex justify-between text-sm dark:text-white"
                >
                  <span>{l}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </PageWrapper>
      </main>

      {/* STATUS MODAL */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Change Order Status"
        description={`Current status: ${order.status}`}
        confirmText="Update Status"
        cancelText="Cancel"
        confirmColor="primary"
        onConfirm={async () => {
          if (!newStatus) return;
          showLoader();
          try {
            await api.patch(`/orders/${order._id}/status`, {
              status: newStatus,
            });
            setOrder({ ...order, status: newStatus });
            showAlert("success", "Order status updated");
          } catch (e) {
            showApiError(e);
          } finally {
            hideLoader();
            setStatusModalOpen(false);
            setNewStatus("");
          }
        }}
      >
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select status</option>
          {allowedNext.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Modal>
    </div>
  );
};

export default OrderDetailsPage;
