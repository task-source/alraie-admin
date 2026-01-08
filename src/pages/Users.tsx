import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import Header from "../components/Header";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import FilterDropdown from "../components/FilterDropdown";
import { PhotoIcon } from "@heroicons/react/24/outline";

interface User {
  _id: string | undefined;
  name: string | undefined;
  email: string | undefined;
  role: string | undefined;
  createdAt: string | undefined;
  phone: string | undefined;
  profileImage: string | undefined;
}

const Users: React.FC = () => {
  const { showApiError } = useAlert();
  const { showLoader, hideLoader } = useLoader();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [sort, setSort] = useState<string>("date_latest");
  const [isEmailVerified, setIsEmailVerified] = useState<string>("");
  const [isPhoneVerified, setIsPhoneVerified] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [createdFrom, setCreatedFrom] = useState<string>("");
  const [createdTo, setCreatedTo] = useState<string>("");
  const [animalType, setAnimalType] = useState<"farm" | "pet" | "">("");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchLoggedUser = async () => {
      try {
        const res = await api.get("/auth/myDetails");
        if (res?.data?.success && res.data.user) {
          setLoggedUser(res.data.user);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchLoggedUser();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      showLoader();

      const params: Record<string, any> = {
        page,
        limit,
        sort,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (role) params.role = role;
      if (animalType) params.animalType = animalType;
      if (language) params.language = language;
      if (country) params.country = country;

      if (isEmailVerified !== "") {
        params.isEmailVerified = isEmailVerified === "true";
      }

      if (isPhoneVerified !== "") {
        params.isPhoneVerified = isPhoneVerified === "true";
      }

      if (createdFrom) params.createdFrom = createdFrom;
      if (createdTo) params.createdTo = createdTo;

      const res = await api.get("/admin/users", { params });

      if (res.data.success) {
        setUsers(res.data.users || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page,
    limit,
    debouncedSearch,
    role,
    sort,
    isEmailVerified,
    isPhoneVerified,
    language,
    country,
    createdFrom,
    createdTo,
    animalType,]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    role,
    sort,
    isEmailVerified,
    isPhoneVerified,
    language,
    country,
    createdFrom,
    createdTo,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const columns: DataTableColumn<User>[] = [
    {
      key: "image",
      label: "Profiile Image",
      render: (i) => <ImageWithFallback src={i.profileImage} />,
    },
    {
      key: "name",
      label: "Name",
      render: (u) => u.name ?? "N/A",
    },
    {
      key: "id",
      label: "ID",
      render: (u) => u._id ?? "N/A",
    },
    {
      key: "phone",
      label: "Phone",
      render: (u) => u.phone ?? "N/A",
    },
    {
      key: "email",
      label: "Email",
      render: (u) => u.email ?? "N/A",
    },
    {
      key: "role",
      label: "Role",
      render: (u) => u.role?.toUpperCase() ?? "N/A",
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (u) =>
        u.createdAt ? new Date(u.createdAt).toLocaleString() : "N/A",
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (u) => {
        const allowed = canDeleteUser(u);

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!allowed) return; // ❗ stops modal open when disabled
              setUserToDelete(u);
              setDeleteModalOpen(true);
            }}
            disabled={!allowed}
            className={`rounded-lg px-3 py-1 text-sm font-medium border transition
              ${allowed
                ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer"
                : "border-gray-400 text-gray-400 bg-gray-200 cursor-not-allowed"
              }`}
          >
            Delete
          </button>
        );
      },
    },
  ];

  const handleDeleteUser = async () => {
    if (!userToDelete?._id) return;

    try {
      showLoader();

      let res;
      if (userToDelete.role === "admin") {
        res = await api.delete(`/auth/admin/${userToDelete._id}`);
      } else {
        res = await api.post(`/auth/${userToDelete._id}/delete`, {
        "reason": "Deleted by admin from users page"
      });
      }
      if (res?.data?.success) {
        fetchUsers();
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const canDeleteUser = (target: User): boolean => {
    if (!loggedUser || !target) return false;

    // superadmin rules
    if (loggedUser.role === "superadmin") {
      if (loggedUser._id === target._id) return false; // can't delete self
      if (target.role === "superadmin") return false; // can't delete other superadmins
      return true;
    }

    // admin rules
    if (loggedUser.role === "admin") {
      if (target.role === "admin") return false; // can't delete admins
      if (target.role === "superadmin") return false; // can't delete superadmins
      return true; // can delete owner & assistant
    }

    // others can't delete anything
    return false;
  };
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col w-full min-w-0 overflow-x-hidden">
        <Header />

        <PageWrapper>
          <div className="px-3 sm:px-6 w-full max-w-full overflow-x-hidden">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-gray-800 dark:text-white">
              Users
            </h1>
            <div className="flex flex-col gap-3 mb-4 w-full">

              {/* Row 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
                />

                <FilterDropdown
                  label="All Roles"
                  value={role}
                  onChange={setRole}
                  options={[
                    { label: "All Roles", value: "" },
                    { label: "Super Admin", value: "superadmin" },
                    { label: "Admin", value: "admin" },
                    { label: "Owner", value: "owner" },
                    { label: "Assistant", value: "assistant" },
                  ]}
                  className="w-full sm:w-48 flex-1"
                />


              </div>

              {/* Row 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">

                <FilterDropdown
                  label="Email Verified"
                  value={isEmailVerified}
                  onChange={setIsEmailVerified}
                  options={[
                    { label: "Email Verified (Any)", value: "" },
                    { label: "Verified", value: "true" },
                    { label: "Not Verified", value: "false" },
                  ]}
                  className="w-full sm:w-48 flex-1"
                />

                <FilterDropdown
                  label="Phone Verified"
                  value={isPhoneVerified}
                  onChange={setIsPhoneVerified}
                  options={[
                    { label: "Phone Verified (Any)", value: "" },
                    { label: "Verified", value: "true" },
                    { label: "Not Verified", value: "false" },
                  ]}
                  className="w-full sm:w-48 flex-1"
                />

              </div>

              {/* Row 3 – Date Range */}
              <div className="flex flex-1 flex-col sm:flex-row gap-3">
                <input
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                  className="border flex-1 rounded-lg px-3 py-2 text-sm w-full sm:w-48 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                  className="border flex-1 rounded-lg px-3 py-2 text-sm w-full sm:w-48 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <FilterDropdown
                  label="Sort By"
                  value={sort}
                  onChange={setSort}
                  options={[
                    { label: "Newest First", value: "date_latest" },
                    { label: "Oldest First", value: "date_oldest" },
                    { label: "Name A–Z", value: "name_asc" },
                    { label: "Name Z–A", value: "name_desc" },
                    { label: "Email A–Z", value: "email_asc" },
                    { label: "Email Z–A", value: "email_desc" },
                  ]}
                  className="w-full sm:w-48 flex-1"
                />
              </div>
              <div className="flex flex-1 flex-col sm:flex-row gap-3">
                <FilterDropdown
                  label="Animal Type"
                  value={animalType}
                  onChange={(v) => setAnimalType(v as any)}
                  options={[
                    { label: "Animal Type (Any)", value: "" },
                    { label: "Farm", value: "farm" },
                    { label: "Pet", value: "pet" },
                  ]}
                  className="w-full sm:w-40 flex-1"
                />
                <FilterDropdown
                  label="Language"
                  value={language}
                  onChange={setLanguage}
                  options={[
                    { label: "Language (Any)", value: "" },
                    { label: "English", value: "en" },
                    { label: "Arabic", value: "ar" },
                  ]}
                  className="w-full sm:w-40 flex-1"
                />
                <button
                  onClick={fetchUsers}
                  className="flex-1 bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm w-full sm:w-auto transition"
                >
                  Apply
                </button>
              </div>
            </div>

            <DataTable<User>
              data={users}
              columns={columns}
              emptyMessage="No users found"
              onRowClick={(row) => {
                if (row.role == "owner" || row.role == "assistant") {
                  navigate(`/user/${row._id}`);
                }
              }}
            />

            {/* Pagination */}
            <div className="flex flex-wrap justify-center mt-5 gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === 1
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
              >
                Prev
              </button>

              {(() => {
                const buttons = [];
                const startPage = Math.max(1, page - 1);
                const endPage = Math.min(totalPages, page + 1);

                for (let num = startPage; num <= endPage; num++) {
                  buttons.push(
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === num
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
                    <span
                      key="ellipsis"
                      className="px-2 text-gray-500 dark:text-gray-400 select-none"
                    >
                      ...
                    </span>
                  );
                }

                if (endPage < totalPages) {
                  buttons.push(
                    <button
                      key={totalPages}
                      onClick={() => setPage(totalPages)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === totalPages
                          ? "bg-[#4F46E5] text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return buttons;
              })()}

              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${page === totalPages
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </PageWrapper>
      </main>
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        title="Delete User?"
        description={
          userToDelete?.role === "owner"
            ? `This will permanently delete the owner ${userToDelete?.name ?? ""
            } and ALL related animals, assistants, GPS devices, and geofences. Are you sure?`
            : `This will permanently delete the ${userToDelete?.role ?? "user"
            } ${userToDelete?.name ?? ""}. Are you sure?`
        }
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={() => {
          setDeleteModalOpen(false);
          handleDeleteUser();
        }}
      />
    </div>
  );
};

export default Users;
