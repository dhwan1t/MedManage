import React, { useState, useEffect } from "react";
import ThemeToggle from "../../components/shared/ThemeToggle";
import { io } from "socket.io-client";

// Mock Socket.io connection instance
// In a real app, you might pass this down via Context
let socket;

const MOCK_INCOMING = [
  { id: "PT-9921", name: "John Doe", eta: "5m" },
  { id: "PT-8842", name: "Jane Smith", eta: "12m" },
];

const BedManagement = () => {
  const [activeTab, setActiveTab] = useState("General");

  // Quick Update State
  const [generalBedsAvailable, setGeneralBedsAvailable] = useState(12);
  const TOTAL_GENERAL = 48;

  // Resource States
  const [icuBeds, setIcuBeds] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      id: `ICU-${i + 1}`,
      name: `ICU Bed ${i + 1}`,
      status: i < 3 ? "AVAILABLE" : i < 8 ? "OCCUPIED" : "RESERVED",
    })),
  );

  const [otTheatres, setOtTheatres] = useState([
    {
      id: "OT-1",
      name: "Theatre 1",
      status: "AVAILABLE",
      equipment: "General",
      surgeon: "Dr. Adams",
    },
    {
      id: "OT-2",
      name: "Theatre 2",
      status: "OCCUPIED",
      equipment: "Cardiac",
      surgeon: "Dr. Stevens",
    },
    {
      id: "OT-3",
      name: "Theatre 3",
      status: "RESERVED",
      equipment: "Neuro",
      surgeon: "Dr. Lee",
    },
    {
      id: "OT-4",
      name: "Theatre 4",
      status: "AVAILABLE",
      equipment: "Ortho",
      surgeon: "Dr. Patel",
    },
  ]);

  const [erBays, setErBays] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      id: `ER-${i + 1}`,
      name: `ER Bay ${i + 1}`,
      status: i < 5 ? "AVAILABLE" : "OCCUPIED",
    })),
  );

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingReservation, setPendingReservation] = useState(null); // { type, item, newStatus }
  const [selectedPatient, setSelectedPatient] = useState("");

  useEffect(() => {
    socket = io("http://localhost:5001");
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const emitAndUpdate = async (updatedData) => {
    try {
      if (socket) {
        socket.emit("hospital:bed_update", updatedData);
      }

      // Call standard API
      await fetch("/api/hospital/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
    } catch (err) {
      console.error("Failed to sync bed update:", err);
    }
  };

  const handleGeneralUpdate = (increment) => {
    let newVal = generalBedsAvailable + increment;
    if (newVal < 0) newVal = 0;
    if (newVal > TOTAL_GENERAL) newVal = TOTAL_GENERAL;
    setGeneralBedsAvailable(newVal);

    emitAndUpdate({ type: "General", available: newVal, total: TOTAL_GENERAL });
  };

  const getStatusColor = (status) => {
    if (status === "AVAILABLE")
      return "bg-green-100 border-green-300 text-green-800";
    if (status === "OCCUPIED") return "bg-red-100 border-red-300 text-red-800";
    if (status === "RESERVED")
      return "bg-yellow-100 border-yellow-300 text-yellow-800";
    return "bg-slate-100 dark:bg-gray-800 border-slate-300 dark:border-gray-600 text-slate-800 dark:text-gray-200";
  };

  const getStatusDotColor = (status) => {
    if (status === "AVAILABLE") return "bg-green-500";
    if (status === "OCCUPIED") return "bg-red-500";
    if (status === "RESERVED") return "bg-yellow-500";
    return "bg-slate-500";
  };

  const cycleStatus = (currentStatus) => {
    const sequence = ["AVAILABLE", "OCCUPIED", "RESERVED"];
    const nextIdx = (sequence.indexOf(currentStatus) + 1) % sequence.length;
    return sequence[nextIdx];
  };

  const handleCardClick = (type, item) => {
    const nextStatus = cycleStatus(item.status);

    if (nextStatus === "RESERVED") {
      setPendingReservation({ type, item, newStatus: nextStatus });
      setModalOpen(true);
      return;
    }

    applyStatusChange(type, item.id, nextStatus);
  };

  const confirmReservation = () => {
    if (!selectedPatient) {
      alert("Please select a patient.");
      return;
    }

    applyStatusChange(
      pendingReservation.type,
      pendingReservation.item.id,
      pendingReservation.newStatus,
      selectedPatient,
    );

    setModalOpen(false);
    setPendingReservation(null);
    setSelectedPatient("");
  };

  const applyStatusChange = (type, id, newStatus, patientId = null) => {
    const payload = { type, id, status: newStatus, reservedFor: patientId };

    if (type === "ICU") {
      setIcuBeds((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)),
      );
    } else if (type === "OT") {
      setOtTheatres((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
      );
    } else if (type === "ER") {
      setErBays((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e)),
      );
    }

    emitAndUpdate(payload);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Quick Actions */}
        <header className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Resource Management
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">
              Update hospital bed and theatre availability.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-gray-900 p-3 rounded-xl border border-slate-200 dark:border-gray-700">
              <span className="font-bold text-slate-700 dark:text-gray-300 whitespace-nowrap">
                General Beds Available:
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleGeneralUpdate(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 font-bold hover:bg-slate-100 dark:bg-gray-800 active:scale-95 transition-all shadow-sm"
                >
                  –
                </button>
                <span className="text-2xl font-black w-8 text-center text-slate-800 dark:text-gray-200 tabular-nums">
                  {generalBedsAvailable}
                </span>
                <button
                  onClick={() => handleGeneralUpdate(1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 font-bold hover:bg-slate-100 dark:bg-gray-800 active:scale-95 transition-all shadow-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["General", "ICU", "OT", "ER"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap
                ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-white dark:bg-gray-900 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700"
                }
              `}
            >
              {tab}{" "}
              {tab === "General"
                ? "Beds"
                : tab === "ICU"
                  ? "Beds"
                  : tab === "OT"
                    ? "Theatres"
                    : "Bays"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <main className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 min-h-[500px]">
          {/* GENERAL TAB */}
          {activeTab === "General" && (
            <div>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200">
                  General Ward Occupancy Matrix
                </h2>
                <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-400"></span>{" "}
                    Available
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-400"></span>{" "}
                    Occupied
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-3">
                {Array.from({ length: TOTAL_GENERAL }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-md border shadow-sm transition-colors cursor-pointer hover:opacity-80
                      ${i < generalBedsAvailable ? "bg-green-400 border-green-500" : "bg-red-400 border-red-500"}
                    `}
                    title={`General Bed ${i + 1}`}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {/* ICU TAB */}
          {activeTab === "ICU" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {icuBeds.map((bed) => (
                <button
                  key={bed.id}
                  onClick={() => handleCardClick("ICU", bed)}
                  className={`relative p-5 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${getStatusColor(bed.status)}`}
                >
                  <div
                    className={`absolute top-3 right-3 w-3 h-3 rounded-full shadow-sm border border-black/10 ${getStatusDotColor(bed.status)}`}
                  ></div>
                  <h3 className="font-bold text-lg mb-1">{bed.name}</h3>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-80">
                    {bed.status}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* OT TAB */}
          {activeTab === "OT" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {otTheatres.map((theatre) => (
                <button
                  key={theatre.id}
                  onClick={() => handleCardClick("OT", theatre)}
                  className={`relative p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col gap-2 ${getStatusColor(theatre.status)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-xl">{theatre.name}</h3>
                    <div
                      className={`w-3.5 h-3.5 rounded-full shadow-sm border border-black/10 ${getStatusDotColor(theatre.status)}`}
                    ></div>
                  </div>

                  <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 space-y-1 my-2 border border-black/5">
                    <p className="text-sm">
                      <strong>Type:</strong> {theatre.equipment}
                    </p>
                    <p className="text-sm">
                      <strong>Surgeon:</strong> {theatre.surgeon}
                    </p>
                  </div>

                  <div className="mt-auto pt-2 border-t border-black/10 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    Status:{" "}
                    <span className="underline decoration-2 underline-offset-4">
                      {theatre.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ER TAB */}
          {activeTab === "ER" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {erBays.map((bay) => (
                <button
                  key={bay.id}
                  onClick={() => handleCardClick("ER", bay)}
                  className={`relative p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${getStatusColor(bay.status)}`}
                >
                  <div
                    className={`absolute top-4 right-4 w-3.5 h-3.5 rounded-full shadow-sm border border-black/10 ${getStatusDotColor(bay.status)}`}
                  ></div>
                  <h3 className="font-extrabold text-xl mb-1">{bay.name}</h3>
                  <div className="text-xs font-bold uppercase tracking-wider opacity-80 mt-2">
                    {bay.status}
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Reservation Modal Frame */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200 mb-2">
              Reserve {pendingReservation?.item?.name}?
            </h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">
              Assign this resource to an incoming patient to mark it as
              reserved.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                  Select Patient
                </label>
                <select
                  className="w-full border-2 border-slate-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500 font-medium text-slate-800 dark:text-gray-200 bg-slate-50 dark:bg-gray-900"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                >
                  <option value="" disabled>
                    -- Select Incoming Ambulance --
                  </option>
                  {MOCK_INCOMING.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.id} - {pt.name} (ETA: {pt.eta})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-gray-800">
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setPendingReservation(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 font-bold text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:bg-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReservation}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-bold shadow-md shadow-blue-200 hover:bg-blue-700"
                >
                  Confirm Reserve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedManagement;
