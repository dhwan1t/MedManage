import React, { useState, useEffect, useContext, useCallback } from "react";
import ThemeToggle from "../../components/shared/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { createSocket } from "../../utils/socket";
import AuthContext from "../../context/AuthContext";

// Map DB status enums to display strings
const STATUS_DISPLAY = {
  accepting: "ACCEPTING",
  at_capacity: "AT CAPACITY",
  emergency_only: "EMERGENCY ONLY",
};

const EMPTY_DATA = {
  stats: {
    ambulances: 0,
    hospitalsOnline: 0,
    casesToday: 0,
    totalCases: 0,
    avgResponse: 0,
  },
  hospitals: [],
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { authHeaders } = useContext(AuthContext);
  const [selectedCity, setSelectedCity] = useState("Ludhiana");
  const [data, setData] = useState(EMPTY_DATA);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [publishingId, setPublishingId] = useState(null);

  // ── P2-04: Fetch real dashboard data from the API ──
  const fetchDashboard = async (city) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/dashboard?city=${encodeURIComponent(city)}`,
        {
          headers: authHeaders(),
        },
      );

      if (!res.ok) {
        console.warn("Failed to fetch admin dashboard:", res.status);
        return;
      }

      const json = await res.json();

      // Map hospitals from API shape to component shape
      const hospitals = (json.hospitals || []).map((h) => ({
        id: h.id || h._id,
        name: h.name,
        beds: h.beds || "0/0",
        icu: h.icu || "0/0",
        ot: h.ot || "0/0",
        er: h.er || "0/0",
        status: STATUS_DISPLAY[h.status] || h.status || "ACCEPTING",
        rating: h.rating || 0,
      }));

      setData({
        stats: {
          ambulances:
            json.stats?.activeAmbulances ?? json.stats?.ambulances ?? 0,
          hospitalsOnline: json.stats?.hospitalsOnline ?? 0,
          casesToday: json.stats?.casesToday ?? json.casesToday ?? 0,
          totalCases: json.stats?.totalCases ?? 0,
          avgResponse: json.stats?.avgResponse ?? 0,
        },
        hospitals,
      });
    } catch (err) {
      console.error("Error fetching admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending alerts from admin API
  const fetchPendingAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pending-alerts", {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPendingAlerts(data);
      }
    } catch (err) {
      console.error("Error fetching pending alerts:", err);
    }
  }, []);

  const handlePublishAlert = async (alertId) => {
    setPublishingId(alertId);
    try {
      const res = await fetch(`/api/admin/alerts/${alertId}/publish`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
      });
      if (res.ok) {
        setPendingAlerts((prev) => prev.filter((a) => a._id !== alertId));
      }
    } catch (err) {
      console.error("Error publishing alert:", err);
    } finally {
      setPublishingId(null);
    }
  };

  // Fetch on mount and when city changes
  useEffect(() => {
    fetchDashboard(selectedCity);
  }, [selectedCity]);

  // Fetch pending alerts on mount
  useEffect(() => {
    fetchPendingAlerts();
  }, [fetchPendingAlerts]);

  // ── P2-11: Use shared authenticated socket ──
  useEffect(() => {
    const socket = createSocket();

    // Listen for real-time case events and build the live feed
    socket.on("case:created", (event) => {
      setFeed((prev) =>
        [
          {
            id: Date.now(),
            text: `New case ${event.caseId} created`,
            time: "Just now",
            type: "stable",
          },
          ...prev,
        ].slice(0, 15),
      );
    });

    socket.on("case:en_route", (event) => {
      setFeed((prev) =>
        [
          {
            id: Date.now(),
            text: `Case ${event.caseId} en route to hospital`,
            time: "Just now",
            type: "urgent",
          },
          ...prev,
        ].slice(0, 15),
      );
    });

    socket.on("case:arrived", (event) => {
      setFeed((prev) =>
        [
          {
            id: Date.now(),
            text: `Case ${event.caseId} arrived at hospital`,
            time: "Just now",
            type: "stable",
          },
          ...prev,
        ].slice(0, 15),
      );
    });

    socket.on("case:assigned", (event) => {
      setFeed((prev) =>
        [
          {
            id: Date.now(),
            text: `Ambulance ${event.ambulanceId} dispatched for case ${event.caseId} (ETA: ${event.eta} min)`,
            time: "Just now",
            type: "urgent",
          },
          ...prev,
        ].slice(0, 15),
      );
    });

    socket.on("patient:vitals_update", (event) => {
      const level = event.severity?.level || "unknown";
      const feedType =
        level === "critical"
          ? "critical"
          : level === "urgent"
            ? "urgent"
            : "stable";
      setFeed((prev) =>
        [
          {
            id: Date.now(),
            text: `Vitals updated for case ${event.caseId} — severity: ${level.toUpperCase()}`,
            time: "Just now",
            type: feedType,
          },
          ...prev,
        ].slice(0, 15),
      );
    });

    socket.on("case:status_update", (event) => {
      setFeed((prev) =>
        [
          {
            id: Date.now(),
            text: `Case ${event.caseId} status: ${event.status}`,
            time: "Just now",
            type: "stable",
          },
          ...prev,
        ].slice(0, 15),
      );
      // Refresh dashboard stats when case status changes
      fetchDashboard(selectedCity);
    });

    return () => socket.disconnect();
  }, [selectedCity]);

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
  };

  const getStatusBadge = (statusStr) => {
    const status = statusStr || "ACCEPTING";
    if (status === "ACCEPTING")
      return (
        <span className="px-2.5 py-1 rounded bg-green-100 text-green-800 font-bold text-xs uppercase tracking-wider">
          {status}
        </span>
      );
    if (status === "AT CAPACITY")
      return (
        <span className="px-2.5 py-1 rounded bg-red-100 text-red-800 font-bold text-xs uppercase tracking-wider">
          {status}
        </span>
      );
    return (
      <span className="px-2.5 py-1 rounded bg-orange-100 text-orange-800 font-bold text-xs uppercase tracking-wider">
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header Setup */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-gray-700 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              City Command Center
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">
              Administrator Overview & Live Dispatches
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <label
                htmlFor="city-select"
                className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest"
              >
                Region:
              </label>
              <input
                id="city-select"
                type="text"
                value={selectedCity}
                onChange={handleCityChange}
                placeholder="Enter city name"
                className="px-4 py-2 border-2 border-slate-200 dark:border-gray-700 rounded-lg text-slate-800 dark:text-gray-200 font-bold outline-none focus:border-indigo-500 bg-white dark:bg-gray-900 shadow-sm w-48"
              />
            </div>
            {loading && (
              <span className="text-xs font-bold text-slate-400 dark:text-gray-500 animate-pulse">
                Loading...
              </span>
            )}
          </div>
        </header>

        {/* TOP STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-800 p-5">
            <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Active Ambulances
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-gray-200">
              {data.stats.ambulances}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-800 p-5">
            <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Hospitals Online
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-gray-200">
              {data.stats.hospitalsOnline}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-800 p-5">
            <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Cases Today
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-gray-200">
              {data.stats.casesToday}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-800 p-5">
            <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Total Cases
            </div>
            <div className="text-3xl font-black text-green-600">
              {data.stats.totalCases}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-800 p-5">
            <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Avg Response
            </div>
            <div className="text-3xl font-black text-indigo-600">
              {data.stats.avgResponse || "—"}{" "}
              <span className="text-lg font-medium tracking-normal text-slate-400 dark:text-gray-500">
                min
              </span>
            </div>
          </div>
        </div>

        {/* Pending Disease Alerts Section */}
        {pendingAlerts.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-orange-100 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 flex justify-between items-center">
              <h2 className="text-lg font-bold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                🦠 Pending Disease Alerts
                <span className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 text-xs font-bold px-2 py-0.5 rounded-md">
                  {pendingAlerts.length}
                </span>
              </h2>
              <span className="text-xs font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest">
                Awaiting Approval
              </span>
            </div>
            <div className="divide-y divide-orange-50 dark:divide-gray-800">
              {pendingAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-800 dark:text-gray-200">
                        {alert.diseaseName || alert.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                          alert.severity === "high"
                            ? "bg-red-100 text-red-800"
                            : alert.severity === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-gray-400 font-medium flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        Cases:{" "}
                        <strong className="text-slate-700 dark:text-gray-300">
                          {alert.caseCount || "N/A"}
                        </strong>
                      </span>
                      <span>
                        Reported by:{" "}
                        <strong className="text-slate-700 dark:text-gray-300">
                          {alert.reportedBy?.name || "Unknown Hospital"}
                        </strong>
                      </span>
                      {alert.message && (
                        <span className="text-slate-400 dark:text-gray-500 italic">
                          {alert.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePublishAlert(alert._id)}
                    disabled={publishingId === alert._id}
                    className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold text-sm shadow-sm hover:bg-orange-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
                  >
                    {publishingId === alert._id
                      ? "Publishing..."
                      : "Publish Alert"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
          {/* Left Column (Table + Map) */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
            {/* Hospital Status Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden flex flex-col flex-1">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200">
                  Hospital Network Status
                </h2>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">
                  {selectedCity} Region
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800">
                      <th className="py-3 px-6 font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">
                        Hospital
                      </th>
                      <th className="py-3 px-6 font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400 text-center">
                        Beds
                      </th>
                      <th className="py-3 px-6 font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400 text-center">
                        ICU
                      </th>
                      <th className="py-3 px-6 font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400 text-center">
                        OT
                      </th>
                      <th className="py-3 px-6 font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400 text-center">
                        ER
                      </th>
                      <th className="py-3 px-6 font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="py-3 px-6 font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.hospitals.map((h) => (
                      <tr
                        key={h.id}
                        onClick={() => navigate(`/admin/hospital/${h.id}`)}
                        className={`border-b border-slate-50 cursor-pointer transition-colors hover:shadow-sm
                          ${h.status === "AT CAPACITY" ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-slate-50 dark:bg-gray-900"}
                        `}
                      >
                        <td className="py-3 px-6 font-bold text-slate-800 dark:text-gray-200">
                          {h.name}
                        </td>
                        <td className="py-3 px-6 text-center font-medium text-slate-600 dark:text-gray-400">
                          {h.beds}
                        </td>
                        <td className="py-3 px-6 text-center font-medium text-slate-600 dark:text-gray-400">
                          {h.icu}
                        </td>
                        <td className="py-3 px-6 text-center font-medium text-slate-600 dark:text-gray-400">
                          {h.ot}
                        </td>
                        <td className="py-3 px-6 text-center font-medium text-slate-600 dark:text-gray-400">
                          {h.er}
                        </td>
                        <td className="py-3 px-6">
                          {getStatusBadge(h.status)}
                        </td>
                        <td className="py-3 px-6 font-bold text-slate-800 dark:text-gray-200 flex items-center gap-1">
                          ⭐ {h.rating}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ambulance Map Placeholder */}
            <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700 relative overflow-hidden flex-1 min-h-[300px] flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #000 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              ></div>

              {/* Map Fake Elements */}
              <div className="absolute top-1/4 left-1/4">
                <div className="text-3xl drop-shadow-md">🏥</div>
                <div className="mt-1 bg-white dark:bg-gray-900 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">
                  City Med
                </div>
              </div>

              <div className="absolute bottom-1/3 right-1/4">
                <div className="text-3xl drop-shadow-md">🏥</div>
                <div className="mt-1 bg-white dark:bg-gray-900 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap">
                  Civil Hosp
                </div>
              </div>

              {/* Routes & Ambulances */}
              <div className="absolute top-1/3 left-1/2 w-32 border-t-2 border-dashed border-indigo-400 rotate-12"></div>
              <div className="absolute top-[30%] left-[45%] translate-x-1/2 translate-y-1/2 animate-bounce">
                <div className="text-2xl drop-shadow-md">🚑</div>
                <div className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm">
                  AMB-2047
                </div>
              </div>

              <div className="z-10 bg-white dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg font-bold text-sm text-slate-500 dark:text-gray-400 shadow-sm border border-slate-200 dark:border-gray-700">
                Interactive Map Integration Placeholder
              </div>
            </div>
          </div>

          {/* Right Sidebar (Live Feed) */}
          <div className="col-span-1 lg:col-span-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 flex flex-col h-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200">
                Live Activity Feed
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {feed.map((item) => (
                <div
                  key={item.id}
                  className={`bg-slate-50 dark:bg-gray-900 border-l-4 rounded-r-lg p-3 shadow-sm transition-all animate-in slide-in-from-left-4
                    ${
                      item.type === "critical"
                        ? "border-red-500 bg-red-50/50"
                        : item.type === "urgent"
                          ? "border-orange-500 bg-orange-50/50"
                          : "border-green-500 bg-green-50/50"
                    }
                  `}
                >
                  <div className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-1">
                    {item.text}
                  </div>
                  <div className="text-xs font-medium text-slate-400 dark:text-gray-500">
                    {item.time}
                  </div>
                </div>
              ))}

              {feed.length === 0 && (
                <div className="text-center text-slate-400 dark:text-gray-500 font-medium py-10">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
