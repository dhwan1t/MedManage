import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../../context/useAuth";

const DISPLAY_TO_API_STATUS = {
  AVAILABLE: "available",
  "ON CALL": "on_call",
  "OFF DUTY": "off_duty",
};

const API_TO_DISPLAY_STATUS = {
  available: "AVAILABLE",
  on_call: "ON CALL",
  off_duty: "OFF DUTY",
};

function mapApiCaseToUi(activeCasePayload) {
  if (!activeCasePayload) return null;

  const c = activeCasePayload;
  const patient = c.patient || {};
  const vitals = patient.vitals || {};

  return {
    id: c._id || c.caseObjectId || c.caseId || "UNKNOWN",
    caseId: c.caseId || "UNKNOWN",
    patientName: patient.name || "Unknown Patient",
    age: patient.age || vitals.age || "N/A",
    emergencyType: vitals.chiefComplaint || "Emergency",
    location: "Location not provided",
    distance: "In progress",
    timeAssigned: new Date(c.createdAt || Date.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    severityScore:
      patient.severity && typeof patient.severity.score === "number"
        ? patient.severity.score
        : "Pending Vitals",
    notes: "Proceed with vitals assessment and hospital selection.",
  };
}

export default function AmbulanceDashboard() {
  const navigate = useNavigate();
  const { authHeaders } = useAuth();

  const [status, setStatus] = useState("AVAILABLE"); // AVAILABLE, ON CALL, OFF DUTY
  const [isConnected, setIsConnected] = useState(false);
  const [activeCase, setActiveCase] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const socketBaseUrl =
    import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

  // Load current ambulance status + active case from backend on mount
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await fetch("/api/ambulance/active-case", {
          headers: authHeaders(),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          setErrorMessage(err.msg || "Failed to load ambulance state.");
          return;
        }

        const data = await response.json();

        // data shape from backend:
        // { activeCase, ambulanceId, status } OR { msg, activeCase: null }
        if (data.status && API_TO_DISPLAY_STATUS[data.status]) {
          setStatus(API_TO_DISPLAY_STATUS[data.status]);
        }

        if (data.activeCase) {
          setActiveCase(mapApiCaseToUi(data.activeCase));
          setStatus("ON CALL");
        } else {
          setActiveCase(null);
        }
      } catch (err) {
        console.error("Bootstrap error:", err);
        setErrorMessage(
          "Network error while loading dashboard. Check server connection.",
        );
      }
    };

    bootstrap();
  }, [authHeaders]);

  // Socket Connection Effect
  useEffect(() => {
    const socket = io(socketBaseUrl, {
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("case:assigned", (data) => {
      // Expected payload from backend:
      // { caseId, caseObjectId, ambulanceId, eta }
      const nextCaseId = data.caseObjectId || data.caseId || "UNKNOWN";
      setActiveCase((prev) => ({
        id: nextCaseId,
        caseId: data.caseId || nextCaseId,
        patientName: prev?.patientName || "New Patient",
        age: prev?.age || "N/A",
        emergencyType: prev?.emergencyType || "Emergency",
        location: prev?.location || "Location pending",
        distance: prev?.distance || "Assigned",
        timeAssigned: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        severityScore: prev?.severityScore || "Pending Vitals",
        notes:
          prev?.notes ||
          "New case assigned. Proceed to patient location and enter vitals.",
      }));
      setStatus("ON CALL");
    });

    return () => {
      socket.disconnect();
    };
  }, [socketBaseUrl]);

  const handleStatusChange = async (newDisplayStatus) => {
    if (status === newDisplayStatus) return;

    setIsUpdatingStatus(true);
    setErrorMessage("");

    const apiStatus = DISPLAY_TO_API_STATUS[newDisplayStatus];

    try {
      const response = await fetch("/api/ambulance/status", {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status: apiStatus }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data.msg || "Failed to update status.");
        return;
      }

      setStatus(newDisplayStatus);

      // If leaving ON CALL, clear active case on UI as well
      if (newDisplayStatus !== "ON CALL" && status === "ON CALL") {
        setActiveCase(null);
      }
    } catch (err) {
      console.error("Status update error:", err);
      setErrorMessage("Network error while updating status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Optional demo helper for UI testing only
  const simulateNewCase = () => {
    const mockCase = {
      id: "mock-" + Math.floor(Math.random() * 10000),
      caseId: "CASE-MOCK",
      patientName: "John Doe",
      age: 45,
      emergencyType: "Chest Pain / Heart attack",
      location: "Sector 12, Main Road, Ludhiana",
      distance: "2.4 km away",
      timeAssigned: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      severityScore: "Pending Vitals",
      notes:
        "Patient reported severe crushing chest pain radiating to left arm.",
    };
    setActiveCase(mockCase);
    setStatus("ON CALL");
  };

  const getStatusColor = (currentStatus) => {
    switch (currentStatus) {
      case "AVAILABLE":
        return "bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]";
      case "ON CALL":
        return "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]";
      case "OFF DUTY":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      {/* Header Container */}
      <div className="bg-slate-900 text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                <svg
                  className="w-7 h-7 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Ambulance</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-xs text-slate-400 font-medium">
                    {isConnected ? "Connected to Dispatch" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-300">Medic Unit</p>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Status Toggle Bar */}
          <div className="bg-slate-800 rounded-xl p-1.5 flex transition-colors relative">
            {isUpdatingStatus && (
              <div className="absolute inset-0 bg-slate-800/50 rounded-xl z-10 flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
            {["AVAILABLE", "ON CALL", "OFF DUTY"].map((s) => (
              <button
                key={s}
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange(s)}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                  status === s
                    ? getStatusColor(s)
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="max-w-4xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl text-red-800 text-sm font-medium">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* State 1: OFF DUTY */}
        {status === "OFF DUTY" && (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-sm mt-8 animate-fadeIn">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4M12 20V4"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You are Off Duty
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Change your status to Available to start receiving new emergency
              dispatches.
            </p>
          </div>
        )}

        {/* State 2: AVAILABLE (No Active Case) */}
        {status === "AVAILABLE" && !activeCase && (
          <div className="bg-white rounded-2xl p-10 text-center border border-green-100 shadow-sm mt-8 animate-fadeIn relative overflow-hidden">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-20 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-60"></div>

            <div className="relative z-10">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Awaiting Dispatch
              </h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                You are available. Any new cases assigned to your unit will
                appear here automatically.
              </p>

              <button
                onClick={simulateNewCase}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
              >
                [Dev] Trigger Mock Case
              </button>
            </div>
          </div>
        )}

        {/* State 3: ON CALL (Active Case Exists) */}
        {status === "ON CALL" && activeCase && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-red-800 font-bold uppercase tracking-wider text-sm">
                  Active Emergency Response
                </span>
              </div>
              <span className="text-sm font-bold text-red-600">
                Assigned: {activeCase.timeAssigned}
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-transparent inline-block">
                    {activeCase.patientName}{" "}
                    <span className="text-gray-400 font-normal ml-2">
                      ({activeCase.age}y/o)
                    </span>
                  </h2>
                  <p className="text-red-600 font-bold mt-1 text-lg">
                    {activeCase.emergencyType}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Case: {activeCase.caseId}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl flex items-center gap-2 self-start md:self-auto">
                  <svg
                    className="w-5 h-5 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <div>
                    <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">
                      Severity Score
                    </p>
                    <p className="text-lg font-bold text-amber-800 leading-none">
                      {activeCase.severityScore}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-b border-gray-100">
                <div className="flex items-start gap-4 mb-4">
                  <div className="mt-1 bg-blue-100 p-2 rounded-lg text-blue-600 flex-shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {activeCase.location}
                    </h3>
                    <p className="text-blue-600 font-medium text-sm mt-0.5">
                      {activeCase.distance}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Dispatch Notes
                  </h4>
                  <p className="text-gray-800 bg-white p-4 rounded-xl border border-gray-200 text-sm leading-relaxed">
                    {activeCase.notes}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-white flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate(`/ambulance/vitals/${activeCase.id}`)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  Enter Patient Vitals
                </button>

                <button
                  onClick={() =>
                    navigate(`/ambulance/recommendations/${activeCase.id}`)
                  }
                  className="flex-1 bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  View Recommendations
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
