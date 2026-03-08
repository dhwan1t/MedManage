import React, { useState, useEffect, useContext } from "react";
import ThemeToggle from "../../components/shared/ThemeToggle";
import { createSocket } from "../../utils/socket";
import AuthContext from "../../context/AuthContext";

const HospitalDashboard = () => {
  const { authHeaders } = useContext(AuthContext);

  const [hospitalName, setHospitalName] = useState("Loading...");
  const [hospitalId, setHospitalId] = useState(null);

  // Disease report modal state
  const [showDiseaseModal, setShowDiseaseModal] = useState(false);
  const [diseaseForm, setDiseaseForm] = useState({
    diseaseName: "",
    caseCount: "",
    severity: "",
    notes: "",
  });
  const [diseaseSubmitting, setDiseaseSubmitting] = useState(false);
  const [diseaseSuccess, setDiseaseSuccess] = useState("");
  const [diseaseError, setDiseaseError] = useState("");
  const [status, setStatus] = useState("ACCEPTING");
  const [lastUpdated, setLastUpdated] = useState(
    new Date().toLocaleTimeString(),
  );

  // P2-10: Bed stats are now fetched from the API instead of hardcoded
  const [stats, setStats] = useState({
    general: { available: 0, total: 0, label: "General Beds" },
    icu: { available: 0, total: 0, label: "ICU Beds" },
    ot: { available: 0, total: 0, label: "OT Theatres" },
    er: { available: 0, total: 0, label: "ER Bays" },
  });

  const [incomingPatients, setIncomingPatients] = useState([]);

  // ── Fetch hospital info + existing incoming cases from API on mount ──
  useEffect(() => {
    const fetchHospitalInfo = async () => {
      try {
        const response = await fetch("/api/hospital/info", {
          headers: authHeaders(),
        });

        if (!response.ok) {
          console.warn("Failed to fetch hospital info:", response.status);
          setHospitalName("Hospital Dashboard");
          return;
        }

        const data = await response.json();

        // P2-12: Set real hospital name from DB
        setHospitalName(data.name || "Hospital Dashboard");
        setHospitalId(data._id ? data._id.toString() : null);

        // Map the DB status to the display status
        const statusMap = {
          accepting: "ACCEPTING",
          at_capacity: "AT CAPACITY",
          emergency_only: "EMERGENCY ONLY",
        };
        setStatus(statusMap[data.status] || "ACCEPTING");

        // P2-10: Set real bed stats from DB
        if (data.resources) {
          setStats({
            general: {
              available: data.resources.generalBeds?.available ?? 0,
              total: data.resources.generalBeds?.total ?? 0,
              label: "General Beds",
            },
            icu: {
              available: data.resources.icuBeds?.available ?? 0,
              total: data.resources.icuBeds?.total ?? 0,
              label: "ICU Beds",
            },
            ot: {
              available: data.resources.otTheatres?.available ?? 0,
              total: data.resources.otTheatres?.total ?? 0,
              label: "OT Theatres",
            },
            er: {
              available: data.resources.erBays?.available ?? 0,
              total: data.resources.erBays?.total ?? 0,
              label: "ER Bays",
            },
          });
        }

        setLastUpdated(new Date().toLocaleTimeString());

        // ── Fetch existing en_route cases so incoming ambulances survive page refresh ──
        try {
          const incomingRes = await fetch("/api/hospital/incoming", {
            headers: authHeaders(),
          });
          if (incomingRes.ok) {
            const incomingData = await incomingRes.json();
            if (Array.isArray(incomingData) && incomingData.length > 0) {
              setIncomingPatients((prev) => {
                // Merge fetched cases with any that arrived via socket, deduplicating
                const merged = [...prev];
                incomingData.forEach((ic) => {
                  const exists = merged.some(
                    (p) =>
                      p.patientId === ic.patientId || p.caseId === ic.caseId,
                  );
                  if (!exists) merged.push(ic);
                });
                return merged.sort(
                  (a, b) => (b.severityScore || 0) - (a.severityScore || 0),
                );
              });
            }
          }
        } catch (incErr) {
          console.warn("Could not fetch incoming cases:", incErr);
        }
      } catch (err) {
        console.error("Error fetching hospital info:", err);
        setHospitalName("Hospital Dashboard");
      }
    };

    fetchHospitalInfo();
  }, []);

  // ── Socket.IO connection with authentication (P0-05, P1-03, P2-11) ──
  useEffect(() => {
    // P2-11: Use shared socket utility instead of hardcoded localhost:5001
    // P0-05: Auth token is automatically attached by createSocket
    const socket = createSocket();

    // P1-03 FIX: The server now auto-joins the hospital room based on the
    // JWT claims (hospitalId). We no longer need to manually emit join:hospital.
    // However, for backwards compatibility and explicit intent, we still emit
    // the join event if we know our hospitalId.
    if (hospitalId) {
      socket.emit("join:hospital", hospitalId.toString());
      console.log("Joining hospital room with ID:", hospitalId.toString());
    }

    // Listen for incoming ambulance dispatches
    socket.on("ambulance:dispatch", (data) => {
      setIncomingPatients((prev) => {
        // Prevent duplicates
        const exists = prev.some(
          (p) => p.patientId === data.patientId || p.caseId === data.caseId,
        );
        if (exists) {
          return prev
            .map((p) =>
              p.patientId === data.patientId || p.caseId === data.caseId
                ? { ...p, ...data }
                : p,
            )
            .sort((a, b) => (b.severityScore || 0) - (a.severityScore || 0));
        }
        const newList = [...prev, data];
        return newList.sort(
          (a, b) => (b.severityScore || 0) - (a.severityScore || 0),
        );
      });
      setLastUpdated(new Date().toLocaleTimeString());
    });

    // Listen for patient vitals updates (scoped to this hospital's room — P0-06)
    socket.on("patient:vitals_update", (data) => {
      setIncomingPatients((prev) => {
        const updated = prev.map((p) =>
          p.patientId === data.patientId ||
          p.caseId === data.caseId ||
          p.caseObjectId === data.caseObjectId
            ? {
                ...p,
                ...data,
                severity: data.severity?.level
                  ? data.severity.level.toUpperCase()
                  : p.severity,
                severityScore: data.severity?.score ?? p.severityScore,
              }
            : p,
        );
        return updated.sort(
          (a, b) => (b.severityScore || 0) - (a.severityScore || 0),
        );
      });
      setLastUpdated(new Date().toLocaleTimeString());
    });

    // Listen for bed/resource updates from other staff or admin
    socket.on("hospital:bed_update", (data) => {
      if (data.resources) {
        setStats({
          general: {
            available: data.resources.generalBeds?.available ?? 0,
            total: data.resources.generalBeds?.total ?? 0,
            label: "General Beds",
          },
          icu: {
            available: data.resources.icuBeds?.available ?? 0,
            total: data.resources.icuBeds?.total ?? 0,
            label: "ICU Beds",
          },
          ot: {
            available: data.resources.otTheatres?.available ?? 0,
            total: data.resources.otTheatres?.total ?? 0,
            label: "OT Theatres",
          },
          er: {
            available: data.resources.erBays?.available ?? 0,
            total: data.resources.erBays?.total ?? 0,
            label: "ER Bays",
          },
        });
        setLastUpdated(new Date().toLocaleTimeString());
      }
    });

    // Listen for case arrival/completion to remove from incoming list
    socket.on("case:arrived", (data) => {
      setIncomingPatients((prev) =>
        prev.filter(
          (p) =>
            p.caseId !== data.caseId && p.caseObjectId !== data.caseObjectId,
        ),
      );
      setLastUpdated(new Date().toLocaleTimeString());
    });

    socket.on("case:status_update", (data) => {
      if (data.status === "completed" || data.status === "arrived") {
        setIncomingPatients((prev) =>
          prev.filter((p) => p.caseId !== data.caseId),
        );
        setLastUpdated(new Date().toLocaleTimeString());
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [hospitalId]);

  const toggleStatus = async () => {
    const statuses = ["ACCEPTING", "AT CAPACITY", "EMERGENCY ONLY"];
    const nextIdx = (statuses.indexOf(status) + 1) % statuses.length;
    const newStatus = statuses[nextIdx];

    // Map display status to DB enum
    const _statusMap = {
      ACCEPTING: "accepting",
      "AT CAPACITY": "at_capacity",
      "EMERGENCY ONLY": "emergency_only",
    };

    setStatus(newStatus);
    setLastUpdated(new Date().toLocaleTimeString());

    // Persist the status change to the server if we had an endpoint
    // For now, it's a local toggle — the hospital status change API
    // can be added as a future enhancement.
  };

  const getStatusBadgeColors = () => {
    if (status === "ACCEPTING")
      return "bg-green-100 text-green-800 border-green-200";
    if (status === "AT CAPACITY")
      return "bg-red-100 text-red-800 border-red-200";
    return "bg-orange-100 text-orange-800 border-orange-200"; // EMERGENCY ONLY
  };

  const renderStatCard = (key) => {
    const stat = stats[key];
    const total = stat.total || 1; // Avoid division by zero
    const occupancy = ((total - stat.available) / total) * 100;

    // green < 70%, yellow 70-90%, red > 90%
    let progressColor = "bg-red-500";
    if (occupancy < 70) progressColor = "bg-green-500";
    else if (occupancy <= 90) progressColor = "bg-yellow-500";

    return (
      <div
        key={key}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-800 p-5 flex flex-col hover:shadow-md transition-shadow"
      >
        <h3 className="text-slate-500 dark:text-gray-400 font-medium text-sm mb-2 uppercase tracking-wide">
          {stat.label}
        </h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-extrabold text-slate-800 dark:text-gray-200">
            {stat.available}
          </span>
          <span className="text-slate-400 dark:text-gray-500 text-sm font-medium">
            / {stat.total} avail
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2.5 mt-auto overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(occupancy, 100)}%` }}
          ></div>
        </div>
        <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-gray-400 text-right">
          {Math.round(occupancy)}% Used
        </div>
      </div>
    );
  };

  const getSeverityBadge = (severity) => {
    if (severity === "CRITICAL")
      return "bg-red-100 text-red-800 border-red-200";
    if (severity === "URGENT")
      return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {hospitalName}
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-300"></span>
              Last Updated: {lastUpdated}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => setShowDiseaseModal(true)}
              className="px-4 py-2.5 rounded-full font-bold text-sm border border-orange-200 bg-orange-50 text-orange-700 transition-all hover:scale-105 active:scale-95 shadow-sm hover:bg-orange-100"
            >
              🦠 Report Disease Trend
            </button>
            <button
              onClick={toggleStatus}
              className={`px-5 py-2.5 rounded-full font-bold text-sm border transition-all hover:scale-105 active:scale-95 shadow-sm ${getStatusBadgeColors()}`}
            >
              {status}
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.keys(stats).map(renderStatCard)}
          </div>
        </section>

        {/* Incoming Patients Panel */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
              </span>
              Actively Incoming Ambulances
              <span className="bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 text-sm font-bold px-2.5 py-0.5 rounded-md ml-2">
                {incomingPatients.length}
              </span>
            </h2>
          </div>

          {incomingPatients.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-700">
              <div className="text-4xl mb-3">🚑</div>
              <p className="text-slate-500 dark:text-gray-400 font-medium">
                No incoming ambulances at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingPatients.map((patient, index) => {
                const isHighestPriority =
                  index === 0 && incomingPatients.length > 1;

                return (
                  <div
                    key={patient.patientId || patient.caseId || index}
                    className={`flex flex-col md:flex-row bg-white dark:bg-gray-900 border ${isHighestPriority ? "border-red-300 shadow-md ring-1 ring-red-100" : "border-slate-200 dark:border-gray-700"} rounded-xl p-5 gap-4 items-start md:items-center relative overflow-hidden`}
                  >
                    {isHighestPriority && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                    )}

                    <div
                      className={`flex-1 ${isHighestPriority ? "pl-2" : ""}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-slate-800 dark:text-gray-200">
                          {patient.name ||
                            patient.patientId ||
                            "Unknown Patient"}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded border text-xs tracking-wide font-bold uppercase ${getSeverityBadge(patient.severity)}`}
                        >
                          {patient.severity || "UNKNOWN"}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-slate-600 dark:text-gray-400 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div className="flex flex-col">
                          <span className="text-slate-400 dark:text-gray-500 text-xs uppercase mb-0.5">
                            ETA
                          </span>
                          <span className="text-slate-800 dark:text-gray-200">
                            {patient.eta || "Calculating..."}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400 dark:text-gray-500 text-xs uppercase mb-0.5">
                            Req. Resources
                          </span>
                          <span className="text-slate-800 dark:text-gray-200">
                            {patient.resources?.join(", ") || "None"}
                          </span>
                        </div>
                        {patient.vitals?.chiefComplaint && (
                          <div className="flex flex-col">
                            <span className="text-slate-400 dark:text-gray-500 text-xs uppercase mb-0.5">
                              Chief Complaint
                            </span>
                            <span className="text-slate-800 dark:text-gray-200">
                              {patient.vitals.chiefComplaint}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isHighestPriority && (
                      <div className="bg-red-50 px-4 py-3 rounded-lg border border-red-100 text-sm text-red-800 font-bold flex items-center gap-2 shrink-0">
                        <span>⚠️</span>
                        <span>Highest Priority</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Disease Report Modal */}
      {showDiseaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200 mb-1">
              🦠 Report Disease Trend
            </h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">
              This report will be sent to admin for review before being
              published as a public alert.
            </p>

            {diseaseSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm font-medium p-3 rounded-lg">
                {diseaseSuccess}
              </div>
            )}
            {diseaseError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 text-sm font-medium p-3 rounded-lg">
                {diseaseError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">
                  Disease Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={diseaseForm.diseaseName}
                  onChange={(e) =>
                    setDiseaseForm((p) => ({
                      ...p,
                      diseaseName: e.target.value,
                    }))
                  }
                  className="w-full border-2 border-slate-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-orange-500 font-medium text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-800 placeholder-gray-400"
                  placeholder="e.g. Dengue, COVID-19"
                  disabled={diseaseSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">
                  Case Count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={diseaseForm.caseCount}
                  onChange={(e) =>
                    setDiseaseForm((p) => ({ ...p, caseCount: e.target.value }))
                  }
                  className="w-full border-2 border-slate-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-orange-500 font-medium text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-800 placeholder-gray-400"
                  placeholder="Number of cases observed"
                  disabled={diseaseSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  value={diseaseForm.severity}
                  onChange={(e) =>
                    setDiseaseForm((p) => ({ ...p, severity: e.target.value }))
                  }
                  className="w-full border-2 border-slate-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-orange-500 font-medium text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  disabled={diseaseSubmitting}
                >
                  <option value="" disabled>
                    Select severity
                  </option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">
                  Notes{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={diseaseForm.notes}
                  onChange={(e) =>
                    setDiseaseForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full border-2 border-slate-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-orange-500 font-medium text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-800 placeholder-gray-400 resize-none"
                  placeholder="Additional details about the trend..."
                  disabled={diseaseSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-gray-800">
                <button
                  onClick={() => {
                    setShowDiseaseModal(false);
                    setDiseaseSuccess("");
                    setDiseaseError("");
                    setDiseaseForm({
                      diseaseName: "",
                      caseCount: "",
                      severity: "",
                      notes: "",
                    });
                  }}
                  disabled={diseaseSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 font-bold text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDiseaseError("");
                    setDiseaseSuccess("");

                    if (
                      !diseaseForm.diseaseName.trim() ||
                      !diseaseForm.caseCount ||
                      !diseaseForm.severity
                    ) {
                      setDiseaseError("Please fill in all required fields.");
                      return;
                    }

                    setDiseaseSubmitting(true);
                    try {
                      const res = await fetch("/api/hospital/report-disease", {
                        method: "POST",
                        headers: authHeaders({
                          "Content-Type": "application/json",
                        }),
                        body: JSON.stringify({
                          diseaseName: diseaseForm.diseaseName.trim(),
                          caseCount: parseInt(diseaseForm.caseCount, 10),
                          severity: diseaseForm.severity,
                          notes: diseaseForm.notes.trim(),
                        }),
                      });

                      const data = await res.json().catch(() => ({}));

                      if (!res.ok) {
                        setDiseaseError(data.msg || "Failed to submit report.");
                      } else {
                        setDiseaseSuccess("Report submitted for admin review.");
                        setDiseaseForm({
                          diseaseName: "",
                          caseCount: "",
                          severity: "",
                          notes: "",
                        });
                        setTimeout(() => {
                          setShowDiseaseModal(false);
                          setDiseaseSuccess("");
                        }, 2000);
                      }
                    } catch (err) {
                      console.error("Disease report error:", err);
                      setDiseaseError("Network error. Please try again.");
                    } finally {
                      setDiseaseSubmitting(false);
                    }
                  }}
                  disabled={diseaseSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-orange-600 text-white font-bold shadow-md shadow-orange-200 hover:bg-orange-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {diseaseSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
