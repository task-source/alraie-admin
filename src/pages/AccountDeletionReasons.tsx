// src/pages/AccountDeletionReasons.tsx
import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import Header from "../components/Header";
import api from "../api/api";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { DataTable, DataTableColumn } from "../components/DataTable";
import Modal from "../components/Modal";

type Language = "en" | "ar";

interface DeletionReason {
  _id: string;
  language: Language;
  text: string;
  active: boolean;
  createdAt: string;
}

const AccountDeletionReasons: React.FC = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showAlert, showApiError } = useAlert();

  const [lang, setLang] = useState<Language>("en");
  const [reasons, setReasons] = useState<DeletionReason[]>([]);

  const [openDialog, setOpenDialog] = useState(false);
  const [newText, setNewText] = useState("");
  const [newActive, setNewActive] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reasonToDelete, setReasonToDelete] = useState<DeletionReason | null>(
    null
  );

  /* ---------------- FETCH ---------------- */

  const fetchReasons = async () => {
    try {
      showLoader();
      const res = await api.get("/deleteReason/admin", {
        params: { lang },
      });
      setReasons(res?.data?.data || []);
    } catch (err) {
      showApiError(err);
      setReasons([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchReasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  /* ---------------- CREATE ---------------- */

  const handleCreate = async () => {
    if (!newText.trim()) {
      showAlert("error", "Reason text is required");
      return;
    }

    try {
      showLoader();
      await api.post("/deleteReason", {
        language: lang,
        text: newText.trim(),
        active: newActive,
      });

      showAlert("success", "Deletion reason created");
      setNewText("");
      setNewActive(true);
      setOpenDialog(false);
      fetchReasons();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  /* ---------------- TOGGLE ---------------- */

  const toggleActive = async (reason: DeletionReason) => {
    try {
      await api.patch(`/deleteReason/${reason._id}`, {
        active: !reason.active,
      });
      fetchReasons();
    } catch (err) {
      showApiError(err);
    }
  };

  /* ---------------- DELETE ---------------- */

  const handleDeleteConfirmed = async () => {
    if (!reasonToDelete) return;

    try {
      showLoader();
      await api.delete(
        `/deleteReason/${reasonToDelete._id}`
      );
      showAlert("success", "Deletion reason removed");
      fetchReasons();
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
      setConfirmOpen(false);
      setReasonToDelete(null);
    }
  };

  /* ---------------- TABLE ---------------- */

  const columns: DataTableColumn<DeletionReason>[] = [
    {
      key: "text",
      label: "Reason Text",
      render: (r) => r.text,
    },
    {
      key: "active",
      label: "Status",
      render: (r) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            r.active
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {r.active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (r) =>
        new Date(r.createdAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (r) => (
<div className="flex flex-col sm:flex-row justify-end gap-2">
          <button
            onClick={() => toggleActive(r)}
            className="border border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white rounded-lg px-3 py-1 text-sm transition"
          >
            {r.active ? "Disable" : "Enable"}
          </button>

          <button
            onClick={() => {
              setReasonToDelete(r);
              setConfirmOpen(true);
            }}
            className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg px-3 py-1 text-sm transition"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  /* ---------------- RENDER ---------------- */

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">

        <Header />
        <PageWrapper>
        <div className="relative w-full min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold mb-6">
            Account Deletion Reasons
          </h1>

          {/* Language Tabs + Add */}
          <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  
  {/* Language Tabs */}
  <div className="flex gap-2 border-b overflow-x-auto whitespace-nowrap max-w-full">
    <button
      onClick={() => setLang("en")}
      className={`px-4 py-2 text-sm font-medium shrink-0 ${
        lang === "en"
          ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
          : "text-gray-500"
      }`}
    >
      English
    </button>
    <button
      onClick={() => setLang("ar")}
      className={`px-4 py-2 text-sm font-medium shrink-0 ${
        lang === "ar"
          ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
          : "text-gray-500"
      }`}
    >
      Arabic
    </button>
  </div>

  {/* Add Button */}
  <button
    onClick={() => setOpenDialog(true)}
    className="bg-[#4F46E5] hover:bg-[#0000CC] text-white text-sm font-medium rounded-lg px-4 py-2 transition w-full sm:w-auto"
  >
    + Add Reason
  </button>
</div>
          </div>
          <div className="relative -mx-4 sm:-mx-0">
  <div className="w-full overflow-x-auto">
    <div className="min-w-[720px]">
      <DataTable<DeletionReason>
        data={reasons}
        columns={columns}
        emptyMessage="No deletion reasons found"
      />
    </div>
  </div>
</div>

          {/* Create Modal */}
          <Modal
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            title="Add Deletion Reason"
            confirmText="Create"
            cancelText="Cancel"
            confirmColor="primary"
            onConfirm={handleCreate}
          >
            <div className="space-y-4">
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Reason text"
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-700 bg-transparent rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newActive}
                  onChange={(e) => setNewActive(e.target.checked)}
                />
                Active
              </label>
            </div>
          </Modal>

          {/* Delete Confirmation */}
          <Modal
            open={confirmOpen}
            onClose={() => {
              setConfirmOpen(false);
              setReasonToDelete(null);
            }}
            title="Delete Reason"
            description={`Are you sure you want to delete this reason?`}
            confirmText="Yes, Delete"
            cancelText="Cancel"
            confirmColor="danger"
            onConfirm={handleDeleteConfirmed}
          />
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default AccountDeletionReasons;
