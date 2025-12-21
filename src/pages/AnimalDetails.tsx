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

interface Relation {
  relation: string;
  animalId: string;
  uniqueAnimalId?: string;
  name?: string;
}

interface AnimalReport {
  _id: string;
  temperature?: number;
  heartRate?: number;
  weight?: number;
  disease?: string;
  allergy?: string;
  vaccinated?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AnimalDetail {
  _id: string;
  uniqueAnimalId?: string;
  name?: string;
  gender?: string;

  typeNameEn?: string;
  breedNameEn?: string;

  gpsSerialNumber?: string;
  gpsDeviceId?: {
    _id?: string;
    serialNumber?: string;
  };
  reportId?: string;
  images?: string[];
  animalStatus?: string;

  ownerId?: string;
  createdBy?: string;

  fatherName?: string;
  motherName?: string;

  relations?: Relation[];

  hasVaccinated?: boolean;
  purpose?: string;
  reproductiveStatus?: string;
  category?: string;

  dob?: string | null;
  country?: string | null;
  tagId?: string | null;

  metadata?: any;

  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*                                   USER                                     */
/* -------------------------------------------------------------------------- */

interface User {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  profileImage?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

const AnimalDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { showLoader, hideLoader } = useLoader();
  const { showApiError, showAlert } = useAlert();

  const [animal, setAnimal] = useState<AnimalDetail | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [creator, setCreator] = useState<User | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [gpsUnlinkModalOpen, setGpsUnlinkModalOpen] = useState(false);
  const [gpsDeleteModalOpen, setGpsDeleteModalOpen] = useState(false);
  const [report, setReport] = useState<AnimalReport | null>(null);
  /* -------------------------------------------------------------------------- */
  /*                               FETCH ANIMAL                                 */
  /* -------------------------------------------------------------------------- */

  const ImageWithFallback: React.FC<{
    src?: string;
    alt?: string;
    className?: string;
  }> = ({ src, alt, className }) => {
    const [failed, setFailed] = useState(false);
  
    if (!src || failed) {
      return (
        <div className="w-12 h-12 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <PhotoIcon className="w-8 h-8 text-gray-400" />
        </div>
      );
    }
  
    return (
      <img
        src={src}
        alt={alt || "image"}
        onError={() => setFailed(true)}
        className={
          className ??
          "w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-gray-700"
        }
      />
    );
  };

  const fetchAnimal = async () => {
    if (!id) return;
    try {
      showLoader();
      const res = await api.get(`/animals/${id}`);
      if (res?.data?.success) {
        setAnimal(res.data.data);
      }
    } catch (err) {
      showApiError(err);
      navigate(-1);
    } finally {
      hideLoader();
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            FETCH USER FULL DETAILS                          */
  /* -------------------------------------------------------------------------- */

  const fetchFullUser = async (uid: string | undefined) => {
    if (!uid) return null;
    try {
      const res = await api.get(`/admin/user/${uid}`);
      return res?.data?.data?.user ?? null;
    } catch {
      return null;
    }
  };

  const fetchAnimalReport = async (reportId?: string) => {
    if (!reportId) return;
  
    try {
      const res = await api.get(`/animalReport/${reportId}`);
      if (res?.data?.success) {
        setReport(res.data.data);
      }
    } catch {
      setReport(null);
    }
  };
  /* -------------------------------------------------------------------------- */
  /*                           LOAD OWNER + CREATOR                              */
  /* -------------------------------------------------------------------------- */

  const loadUsers = async () => {
    if (!animal) return;

    showLoader();
    try {
      if (animal.ownerId) {
        const o = await fetchFullUser(animal.ownerId);
        setOwner(o);
      }

      if (animal.createdBy && animal.createdBy !== animal.ownerId) {
        const c = await fetchFullUser(animal.createdBy);
        setCreator(c);
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchAnimal();
  }, [id]);

  useEffect(() => {
    if (animal) {
      loadUsers();
      fetchAnimalReport(animal.reportId);
    }
  }, [animal]);

  /* -------------------------------------------------------------------------- */
  /*                             DELETE ANIMAL                                   */
  /* -------------------------------------------------------------------------- */

  const handleDeleteAnimal = async () => {
    if (!id) return;
    try {
      showLoader();
      const res = await api.delete(`/animals/${id}`);
      if (res?.data?.success) {
        showAlert("success", "Animal deleted");
        navigate(-1);
      } else {
        showAlert("error", "Delete failed");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const handleGpsUnlink = async () => {
    if (!animal?.gpsSerialNumber) return;

    try {
      showLoader();
      const res = await api.post("/gps/unlink", {
        serialNumber: animal.gpsSerialNumber,
      });

      if (res?.data?.success) {
        showAlert("success", "GPS unlinked successfully");
        fetchAnimal(); // refresh page
      } else {
        showAlert("error", "Unlink failed");
      }
    } catch (err) {
      showApiError(err);
    } finally {
      hideLoader();
    }
  };

  const handleGpsDelete = async () => {
    if (!animal?.gpsSerialNumber) return;

    try {
      showLoader();
      const res = await api.post("/gps/delete", {
        serialNumber: animal.gpsSerialNumber,
      });

      if (res?.data?.success) {
        showAlert("success", "GPS deleted successfully");
        fetchAnimal(); // refresh page
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
                Animal Details
              </h1>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
                >
                  Back
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
            {/* IMAGE CAROUSEL */}
            {/* --------------------------------------------------------- */}

            {animal?.images?.length ? (
              <div className="mb-8 w-full overflow-x-auto whitespace-nowrap no-scrollbar">
                <div className="flex gap-3">
                  {animal.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      className="w-32 h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
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
            {/* ANIMAL FULL INFO CARD */}
            {/* --------------------------------------------------------- */}

            {animal && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {Object.entries({
                  "Animal ID": animal.uniqueAnimalId,
                  Name: animal.name,
                  Gender: animal.gender,
                  Type: animal.typeNameEn,
                  Breed: animal.breedNameEn,
                  Status: animal.animalStatus,
                  Vaccinated: animal.hasVaccinated ? "Yes" : "No",
                  Purpose: animal.purpose,
                  Reproduction: animal.reproductiveStatus,
                  Category: animal.category,
                  "Tag ID": animal.tagId,
                  "GPS Serial": animal.gpsSerialNumber,
                  DOB: animal.dob,
                  Country: animal.country,
                  "Created At": animal.createdAt
                    ? new Date(animal.createdAt).toLocaleString()
                    : "—",
                }).map(([label, val]) => (
                  <div key={label}>
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      {label}
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 break-all">
                      {val || "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {report ? (
              <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-5">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                  Animal Report
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {Object.entries({
                    Temperature: report.temperature ? `${report.temperature} °C` : null,
                    "Heart Rate": report.heartRate,
                    Weight: report.weight ? `${report.weight} kg` : null,
                    Disease: report.disease,
                    Allergy: report.allergy,
                    Vaccinated: report.vaccinated ? "Yes" : "No",
                    Notes: report.notes,
                    "Reported At": report.createdAt
                      ? new Date(report.createdAt).toLocaleString()
                      : null,
                  }).map(([label, value]) => (
                    <div key={label}>
                      <div className="text-xs uppercase text-gray-500 dark:text-gray-400">
                        {label}
                      </div>
                      <div className="text-gray-900 dark:text-gray-100 break-all">
                        {value ?? "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-5 text-sm text-gray-500 dark:text-gray-400">
                No report available for this animal.
              </div>
            )}
            {/* --------------------------------------------------------- */}
            {/* RELATIONS */}
            {/* --------------------------------------------------------- */}

            {(animal?.relations?.length ?? 0) > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  Relations
                </h2>

                <div className="space-y-2">
                  {animal?.relations?.map((rel, i) => (
                    <div
                      key={i}
                      onClick={() => navigate(`/animal/${rel.animalId}`)}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="font-medium text-gray-800 dark:text-white">
                        {rel.relation.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {rel.name} — {rel.uniqueAnimalId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* GPS DETAILS */}
            {/* --------------------------------------------------------- */}
            {animal?.gpsDeviceId && (
              <div className="mb-8 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
                <div className="font-semibold text-gray-800 dark:text-white mb-2">
                  GPS Device
                </div>

                <div className="flex text-sm text-gray-700 dark:text-gray-300 items-center justify-between cursor-pointer">
                  Serial: {animal.gpsDeviceId.serialNumber}
                  <div className="flex gap-2 mt-4">
                    {/* UNLINK GPS */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setGpsUnlinkModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 text-sm"
                    >
                      Unlink GPS
                    </button>

                    {/* DELETE GPS */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setGpsDeleteModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 text-sm"
                    >
                      Delete GPS
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* OWNER DETAILS */}
            {/* --------------------------------------------------------- */}

            {owner && (
              <div
                onClick={() => navigate(`/user/${owner._id}`)}
                className="mb-8 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="font-semibold text-gray-800 dark:text-white">
                  Owner Details
                </div>
                <div className="flex gap-5 items-center text-sm text-gray-700 dark:text-gray-300 mt-2">
                  <div className="overflow-x-auto whitespace-nowrap no-scrollbar">
                    <ImageWithFallback
                      src={owner.profileImage}
                      alt={owner?.name ?? "owner"}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  </div>
                  {owner._id ? `${owner._id}` : ""}
                  {owner.email ? ` - ${owner.email}` : ""}
                  {owner.phone ? ` - ${owner.phone}` : ""}
                  {owner.name ? ` - ${owner.name}` : ""}
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* CREATOR DETAILS */}
            {/* --------------------------------------------------------- */}

            {creator && creator._id != owner?._id && (
              <div
                onClick={() => navigate(`/user/${creator._id}`)}
                className="mb-12 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="font-semibold text-gray-800 dark:text-white">
                  Created By
                </div>
                <div className="flex gap-5 items-center text-sm text-gray-700 dark:text-gray-300 mt-2">
                <div className="overflow-x-auto whitespace-nowrap no-scrollbar">
                    <ImageWithFallback
                      src={creator.profileImage}
                      alt={creator?.name ?? "owner"}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  </div>
                  {creator._id ? `${creator._id}` : ""}
                  {creator.email ? ` - ${creator.email}` : ""}
                  {creator.phone ? ` - ${creator.phone}` : ""}
                  {creator.name ? ` - ${creator.name}` : ""}
                </div>
              </div>
            )}
          </div>
        </PageWrapper>
      </main>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Animal?"
        description="This will permanently delete this animal and unlink any assigned GPS devices. Are you sure?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={() => {
          setDeleteModalOpen(false);
          handleDeleteAnimal();
        }}
      />

      <Modal
        open={gpsUnlinkModalOpen}
        onClose={() => setGpsUnlinkModalOpen(false)}
        title="Unlink GPS?"
        description={`This will unlink GPS device serial ${animal?.gpsSerialNumber}. Are you sure?`}
        confirmText="Yes, Unlink"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={() => {
          setGpsUnlinkModalOpen(false);
          handleGpsUnlink();
        }}
      />

      <Modal
        open={gpsDeleteModalOpen}
        onClose={() => setGpsDeleteModalOpen(false)}
        title="Delete GPS?"
        description={`This will permanently delete GPS device serial ${animal?.gpsSerialNumber}. Are you sure?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="danger"
        onConfirm={() => {
          setGpsDeleteModalOpen(false);
          handleGpsDelete();
        }}
      />
    </div>
  );
};

export default AnimalDetails;
