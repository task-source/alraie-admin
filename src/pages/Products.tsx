import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { PhotoIcon } from "@heroicons/react/24/outline";
import FilterDropdown from "../components/FilterDropdown";

interface ProductRow {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  stockQty: number;
  isActive: boolean;
  images?: string[];  
  categoryId?: string | null;
  createdAt?: string;
}

const Products: React.FC = () => {
  const FALLBACK_IMG = <PhotoIcon className="w-12 h-12 text-gray-400" />;
  const { showApiError, showAlert } = useAlert();
  const { showLoader, hideLoader } = useLoader();
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [categoryId, setCategoryId] = useState<string>("");
  const [currency, setCurrency] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const [includeInactive, setIncludeInactive] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);

  const [debouncedCurrency, setDebouncedCurrency] = useState("");
const [debouncedMinPrice, setDebouncedMinPrice] = useState("");
const [debouncedMaxPrice, setDebouncedMaxPrice] = useState("");

  /* ---------------- DEBOUNCE SEARCH ---------------- */
  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedCurrency(currency);
    }, 500);
    return () => clearTimeout(t);
  }, [currency]);
  
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
    }, 500);
    return () => clearTimeout(t);
  }, [minPrice]);
  
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedMaxPrice(maxPrice);
    }, 500);
    return () => clearTimeout(t);
  }, [maxPrice]);
  /* ---------------- FETCH PRODUCTS ---------------- */
  const fetchProducts = async () => {
    try {
      showLoader();
      const params: any = {
        page,
        limit,
        search: debouncedSearch || undefined,
        // categoryId: categoryId || undefined,
        currency: debouncedCurrency || undefined,
  minPrice: debouncedMinPrice || undefined,
  maxPrice: debouncedMaxPrice || undefined,
        includeInactive,
        sortBy,
        sortOrder,
      };

      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === "") delete params[k];
      });

      const res = await api.get("/products", { params });

      if (res?.data?.success) {
        setProducts(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setProducts([]);
      }
    } catch (err) {
      showApiError(err);
      setProducts([]);
    } finally {
      hideLoader();
    }
  };

  /* reset page when filters change */
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    // categoryId,
    debouncedCurrency,
    debouncedMinPrice,
    debouncedMaxPrice,
    includeInactive,
    sortBy,
    sortOrder,
    limit,
  ]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    limit,
    debouncedSearch,
    // categoryId,
    debouncedCurrency,
    debouncedMinPrice,
    debouncedMaxPrice,
    includeInactive,
    sortBy,
    sortOrder,
  ]);

  /* ---------------- ACTIONS ---------------- */

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      showLoader();
      const res = await api.delete(`/products/${selectedProduct._id}`);
      if (res?.data?.success) {
        showAlert("success", "Product deleted");
        fetchProducts();
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const toggleActive = async (p: ProductRow) => {
    try {
      showLoader();
      await api.put(`/products/${p._id}/${p.isActive ? "deactivate" : "activate"}`);
      showAlert("success", "Product status updated");
      fetchProducts();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  /* ---------------- COLUMNS ---------------- */

  const columns: DataTableColumn<ProductRow>[] = [
    {
      key: "image",
      label: "Image",
      render: (r) => {
        const src = r.images?.[0];
    
        return (
          <div className="flex items-center">
            {src ? (
              <img
                src={src}
                alt={r.name}
                onError={(e: any) => {
                  e.currentTarget.style.display = "none";
                }}
                className="w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              FALLBACK_IMG
            )}
          </div>
        );
      },
    },
    {
      key: "name",
      label: "Name",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
            {r.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {r.slug}
          </span>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (r) => `${r.price} ${r.currency}`,
    },
    {
      key: "stockQty",
      label: "Stock",
      render: (r) => (
        <span className={r.stockQty === 0 ? "text-red-600 font-medium" : ""}>
          {r.stockQty}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded-md font-medium ${
            r.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {r.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At (UTC)",
      render: (r) =>
        r.createdAt
          ? new Date(r.createdAt).toLocaleString(undefined, {
              timeZone: "UTC",
            })
          : "N/A",
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleActive(r);
            }}
            className="px-3 py-1 rounded-md border text-xs"
          >
            {r.isActive ? "Deactivate" : "Activate"}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProduct(r);
              setDeleteModalOpen(true);
            }}
            className="px-3 py-1 rounded-md border border-red-600 text-red-600 hover:bg-red-50 text-xs"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  /* ---------------- PAGINATION (SAME AS ANIMALS) ---------------- */

  const renderPaginationButtons = () => {
    const buttons = [];
    const startPage = Math.max(1, page - 1);
    const endPage = Math.min(totalPages, page + 1);

    buttons.push(
      <button
        key="prev"
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={page === 1}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          page === 1
            ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        Prev
      </button>
    );

    for (let num = startPage; num <= endPage; num++) {
      buttons.push(
        <button
          key={num}
          onClick={() => setPage(num)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            page === num
              ? "bg-[#4F46E5] text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {num}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      buttons.push(
        <span key="ellipsis" className="px-2 text-gray-500 dark:text-gray-400">
          ...
        </span>
      );
    }

    if (endPage < totalPages) {
      buttons.push(
        <button
          key={totalPages}
          onClick={() => setPage(totalPages)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            page === totalPages
              ? "bg-[#4F46E5] text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {totalPages}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={page === totalPages}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          page === totalPages
            ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        Next
      </button>
    );

    return buttons;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
        <Header />
        <PageWrapper>
          <div className="px-3 sm:px-6 w-full max-w-full overflow-x-hidden">
          <div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">
    Products
  </h1>

  <button
    onClick={() => navigate("/products/new")}
    className="bg-[#4F46E5] hover:bg-[#0000CC] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
  >
    + Add Product
  </button>
</div>
            {/* FILTERS */}
            <div className="flex flex-col md:items-center gap-3 mb-4 w-full">
              <div className="flex gap-3 flex-col sm:flex-row w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-10 py-2 focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <FiSearch />
                  </div>
                </div>

                {/* <input
                  placeholder="Category ID"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2"
                /> */}

                <input
                  placeholder="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <input
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                />
                <input
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 dark:text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
<FilterDropdown
  label="Sort by Created At"
  value={sortBy}
  options={[
    { label: "Sort by Created At", value: "createdAt" },
    { label: "Sort by Price", value: "price" },
    { label: "Sort by Name", value: "name" },
  ]}
  onChange={(val) => setSortBy(val)}
  className="flex-1 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg w-full h-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
/>

<FilterDropdown
  label="Descending"
  value={sortOrder}
  options={[
    { label: "Descending", value: "desc" },
    { label: "Ascending", value: "asc" },
  ]}
  onChange={(val) => setSortOrder(val)}
  className="flex-1 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg w-full h-full focus:ring-2 focus:ring-[#4F46E5] outline-none text-gray-800 dark:text-white"
/>
                <label className="flex-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={includeInactive}
                    onChange={(e) => setIncludeInactive(e.target.checked)}
                  />
                  Include inactive
                </label>

                <button
                  onClick={() => fetchProducts()}
                  className="flex-1 bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm transition"
                >
                  Apply
                </button>
              </div>
            </div>

            <DataTable<ProductRow>
              data={products}
              columns={columns}
              onRowClick={(row) => navigate(`/products/${row._id}`)}
              emptyMessage="No products found"
            />

            <div className="flex flex-wrap justify-center mt-5 gap-2">
              {renderPaginationButtons()}
            </div>
          </div>
        </PageWrapper>
      </main>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Product?"
        description="This will permanently delete this product. Are you sure?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Products;
