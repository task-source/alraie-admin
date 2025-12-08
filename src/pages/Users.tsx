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

interface User {
  _id: string | undefined;
  name: string | undefined;
  email: string | undefined;
  role: string | undefined;
  createdAt: string | undefined;
  phone: string | undefined;
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
        search: debouncedSearch,
      };
      if (role) params.role = role;

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
  }, [page, limit, debouncedSearch, role]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns: DataTableColumn<User>[] = [
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
              ${
                allowed
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

      const res = await api.delete(`/auth/${userToDelete._id}`);
      if (res?.data?.success) {
        // success
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

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 w-full">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm rounded-lg px-3 py-2 w-full sm:w-64 focus:ring-2 focus:ring-[#4F46E5] outline-none dark:text-white"
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-700 
             bg-white dark:bg-gray-800 
             text-sm rounded-lg px-3 py-2 w-full sm:w-48 
             focus:ring-2 focus:ring-[#4F46E5] outline-none
             text-gray-800 dark:text-white"
              >
                <option value="">All Roles</option>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
                <option value="assistant">Assistant</option>
              </select>

              <button
                onClick={fetchUsers}
                className="bg-[#4F46E5] hover:bg-[#0000CC] text-white font-medium rounded-lg px-4 py-2 text-sm w-full sm:w-auto transition"
              >
                Apply
              </button>
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
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  page === 1
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

                return buttons;
              })()}

              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  page === totalPages
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
            ? `This will permanently delete the owner ${
                userToDelete?.name ?? ""
              } and ALL related animals, assistants, GPS devices, and geofences. Are you sure?`
            : `This will permanently delete the ${
                userToDelete?.role ?? "user"
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
