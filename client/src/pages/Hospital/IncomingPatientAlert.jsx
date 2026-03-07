import React, { useState, useEffect, useContext } from "react";
import ThemeToggle from "../../components/shared/ThemeToggle";
import { useParams } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { createSocket } from "../../utils/socket";

const IncomingPatientAlert = () => {
  const { caseId } = useParams();
  const { authHeaders } = useContext(AuthContext);
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  // Optimistic UI states for allocation buttons
  const [allocationStatus, setAllocationStatus] = useState({
    ICU: false,
    OT: false,
    ER: false,
  });

  useEffect(() => {
    // Fetch case data
    const fetchCase = async () => {
      try {
        const response = await fetch(`/api/cases/${caseId}`, {
          headers: authHeaders(),
        });
        if (response.ok) {
          const data = await response.json();

          // P2-05: Compute ETA from case data instead of hardcoding.
          // The API returns populated case data with timeline events.
          // We compute a countdown from the en_route timeline event
          // plus the estimated travel time (estimatedEta field or
          // from the AI recommendation's estimatedMinutes).
          let etaSeconds = 0;

          // Try to get ETA from the case's AI recommendations
          if (
            data.aiRecommendations &&
            data.aiRecommendations.length > 0 &&
            data.selectedHospital
          ) {
            const selectedRec = data.aiRecommendations.find(
              (r) =>
                r.hospitalId ===
                (data.selectedHospital._id || data.selectedHospital),
            );
            if (selectedRec && selectedRec.distance != null) {
              // Estimate: distance * 2.5 min + 2 min base, converted to seconds
              etaSeconds = Math.round((selectedRec.distance * 2.5 + 2) * 60);
            }
          }

          // If we have a timeline with an en_route event, subtract elapsed time
          if (etaSeconds > 0 && data.timeline) {
            const enRouteEvent = data.timeline.find(
              (e) => e.event === "en_route",
            );
            if (enRouteEvent) {
              const elapsedSeconds = Math.floor(
                (Date.now() - new Date(enRouteEvent.timestamp).getTime()) /
                  1000,
              );
              etaSeconds = Math.max(0, etaSeconds - elapsedSeconds);
            }
          }

          // Fallback: if no ETA could be computed, use a reasonable default
          if (etaSeconds === 0 && data.status === "en_route") {
            etaSeconds = 5 * 60; // 5 minute default
          }

          // Enrich the case data with patient info for display
          const patient = data.patient || {};
          const enriched = {
            ...data,
            patientId: patient.name || patient._id || caseId,
            age: patient.age || patient.vitals?.age || "N/A",
            gender: patient.gender || "Unknown",
            consciousness: patient.vitals?.consciousness || "Unknown",
            knownConditions: patient.vitals?.conditions || [],
            severity: patient.severity ||
              data.severity || { score: 0, level: "unknown", flags: [] },
            vitals: patient.vitals || {},
            chiefComplaint: patient.vitals?.chiefComplaint || "Unknown",
            eta: etaSeconds,
            requiredResources: [],
          };

          // Derive required resources from severity
          if (enriched.severity) {
            if (enriched.severity.score > 70)
              enriched.requiredResources.push("ICU");
            if (enriched.severity.flags?.includes("critical_trauma"))
              enriched.requiredResources.push("OT");
            if (enriched.severity.flags?.includes("respiratory_distress"))
              enriched.requiredResources.push("Ventilator");
          }

          setCaseData(enriched);
          setTimeLeft(etaSeconds);
        } else {
          throw new Error("Failed to fetch data");
        }
      } catch (error) {
        console.warn("Failed to fetch case data:", error);
        // Show an error state instead of mock data
        setCaseData({
          patientId: caseId,
          age: "N/A",
          gender: "Unknown",
          consciousness: "Unknown",
          knownConditions: [],
          severity: { score: 0, level: "unknown", flags: [] },
          vitals: {},
          chiefComplaint: "Data unavailable",
          eta: 0,
          requiredResources: [],
          _fetchError: true,
        });
        setTimeLeft(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId]);

  // P0-05/P2-11: Socket connection for real-time updates with auth
  useEffect(() => {
    if (!caseData || caseData._fetchError) return;

    const socket = createSocket();

    // Listen for vitals updates for this case
    socket.on("patient:vitals_update", (data) => {
      if (
        data.caseId === caseData.caseId ||
        data.caseObjectId === caseData._id
      ) {
        setCaseData((prev) => ({
          ...prev,
          vitals: data.vitals || prev.vitals,
          severity: data.severity || prev.severity,
        }));
      }
    });

    // Listen for case arrival (stop countdown)
    socket.on("case:arrived", (data) => {
      if (
        data.caseId === caseData.caseId ||
        data.caseObjectId === caseData._id
      ) {
        setTimeLeft(0);
      }
    });

    return () => socket.disconnect();
  }, [caseData?.caseId]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0 || !caseData) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, caseData]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAllocate = async (type) => {
    // Optimistic UI update
    setAllocationStatus((prev) => ({ ...prev, [type]: true }));

    try {
      if (type === "ER") {
        await fetch("/api/hospital/alert-er", {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ caseId: caseId || caseData.patientId }),
        });
      } else {
        await fetch("/api/hospital/allocate", {
          method: "PUT",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ type, caseId: caseId || caseData.patientId }),
        });
      }
    } catch (error) {
      console.error(`Error processing ${type} allocation:`, error);
      // Revert on failure
      setAllocationStatus((prev) => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!caseData)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load case data.
      </div>
    );

  const { severity, vitals } = caseData;
  const isCritical = severity.level === "critical";

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Alert Bar */}
        <div
          className={`rounded-xl p-4 shadow-sm border flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse
          ${isCritical ? "bg-red-600 border-red-700 text-white" : "bg-orange-500 border-orange-600 text-white"}
        `}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚨</span>
            <h1 className="text-xl sm:text-2xl font-black tracking-widest uppercase">
              Incoming Patient
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-3 bg-black/20 px-5 py-2.5 rounded-lg border border-white/20">
              <span className="text-sm font-medium uppercase tracking-widest opacity-90">
                ETA:
              </span>
              <span className="text-3xl font-bold font-mono tracking-tighter tabular-nums">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Severity & AI Diagnosis */}
          <div className="md:col-span-1 space-y-6">
            {/* Severity Card */}
            <div
              className={`bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border-2 text-center relative overflow-hidden
              ${isCritical ? "border-red-200" : "border-orange-200"}
            `}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-2 ${isCritical ? "bg-red-500" : "bg-orange-500"}`}
              ></div>
              <h2 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 mt-2">
                Severity Score
              </h2>
              <div
                className={`text-7xl font-black tracking-tighter mb-1 ${isCritical ? "text-red-500" : "text-orange-500"}`}
              >
                {severity.score}
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-gray-800 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                / 100
              </div>
              <div
                className={`mt-4 text-xl font-bold uppercase ${isCritical ? "text-red-600" : "text-orange-600"}`}
              >
                {severity.level}
              </div>
            </div>

            {/* AI Diagnosis Flags */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-indigo-500 text-lg">🤖</span> AI Diagnosis
                Flags
              </h3>
              <div className="flex flex-col gap-2.5">
                {severity.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <span>⚠️</span>
                    {flag.replace("_", " ").toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            {/* Required Resources */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 uppercase tracking-widest mb-4">
                Required Resources
              </h3>
              <ul className="space-y-2">
                {caseData.requiredResources?.map((res, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-slate-600 dark:text-gray-400 font-medium text-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    {res}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Vitals, Patient Info & Actions */}
          <div className="md:col-span-2 space-y-6">
            {/* Patient Profile */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-800">
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-gray-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                    Patient ID
                  </h2>
                  <div className="text-2xl font-black text-slate-800 dark:text-gray-200">
                    {caseData.patientId}
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                    Chief Complaint
                  </h2>
                  <div className="text-xl font-bold text-slate-800 dark:text-gray-200">
                    {caseData.chiefComplaint}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <dt className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase mb-1">
                    Age / Gender
                  </dt>
                  <dd className="font-semibold text-slate-800 dark:text-gray-200">
                    {caseData.age} yr / {caseData.gender}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase mb-1">
                    Consciousness
                  </dt>
                  <dd className="font-semibold text-slate-800 dark:text-gray-200">
                    {caseData.consciousness}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase mb-1">
                    Known Conditions
                  </dt>
                  <dd className="font-semibold text-slate-800 dark:text-gray-200">
                    {caseData.knownConditions?.join(", ") || "None reported"}
                  </dd>
                </div>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 uppercase tracking-widest mb-5">
                Current Vitals
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-3 border border-slate-100 dark:border-gray-800 text-center">
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">
                    HR
                  </div>
                  <div
                    className={`text-xl font-black ${vitals.heartRate > 100 || vitals.heartRate < 60 ? "text-red-500" : "text-slate-800 dark:text-gray-200"}`}
                  >
                    {vitals.heartRate}{" "}
                    <span className="text-xs font-medium text-slate-400 dark:text-gray-500">
                      bpm
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-3 border border-slate-100 dark:border-gray-800 text-center">
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">
                    BP
                  </div>
                  <div
                    className={`text-xl font-black ${vitals.systolic < 90 || vitals.systolic > 160 ? "text-red-500" : "text-slate-800 dark:text-gray-200"}`}
                  >
                    {vitals.systolic}/{vitals.diastolic}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-3 border border-slate-100 dark:border-gray-800 text-center">
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">
                    SpO2
                  </div>
                  <div
                    className={`text-xl font-black ${vitals.oxygenSat < 94 ? "text-red-500" : "text-slate-800 dark:text-gray-200"}`}
                  >
                    {vitals.oxygenSat}
                    <span className="text-xs font-medium text-slate-400 dark:text-gray-500">
                      %
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-3 border border-slate-100 dark:border-gray-800 text-center">
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">
                    Temp
                  </div>
                  <div
                    className={`text-xl font-black ${vitals.temperature > 38 || vitals.temperature < 36 ? "text-red-500" : "text-slate-800 dark:text-gray-200"}`}
                  >
                    {vitals.temperature}
                    <span className="text-xs font-medium text-slate-400 dark:text-gray-500">
                      °C
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-3 border border-slate-100 dark:border-gray-800 text-center">
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">
                    RR
                  </div>
                  <div
                    className={`text-xl font-black ${vitals.respiratoryRate > 20 || vitals.respiratoryRate < 12 ? "text-red-500" : "text-slate-800 dark:text-gray-200"}`}
                  >
                    {vitals.respiratoryRate}
                  </div>
                </div>
              </div>
            </div>

            {/* Pre-Allocation Actions */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 uppercase tracking-widest mb-5">
                Pre-Arrival Allocation Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => handleAllocate("ICU")}
                  disabled={allocationStatus.ICU}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all border-2
                    ${
                      allocationStatus.ICU
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-95 shadow-sm"
                    }
                  `}
                >
                  <span className="text-2xl mb-1">
                    {allocationStatus.ICU ? "✅" : "🛏️"}
                  </span>
                  {allocationStatus.ICU ? "ICU Reserved" : "Reserve ICU Bed"}
                </button>

                <button
                  onClick={() => handleAllocate("OT")}
                  disabled={allocationStatus.OT}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all border-2
                    ${
                      allocationStatus.OT
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 active:scale-95 shadow-sm"
                    }
                  `}
                >
                  <span className="text-2xl mb-1">
                    {allocationStatus.OT ? "✅" : "🔪"}
                  </span>
                  {allocationStatus.OT
                    ? "Theatre Reserved"
                    : "Reserve OT Theatre"}
                </button>

                <button
                  onClick={() => handleAllocate("ER")}
                  disabled={allocationStatus.ER}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition-all border-2
                    ${
                      allocationStatus.ER
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700 active:scale-95 shadow-sm"
                    }
                  `}
                >
                  <span className="text-2xl mb-1">
                    {allocationStatus.ER ? "✅" : "📢"}
                  </span>
                  {allocationStatus.ER ? "ER Notified" : "Alert ER Team"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingPatientAlert;
