import React, { useState, useEffect } from "react";
import { createSocket } from "../../utils/socket";

const FALLBACK_ALERTS = [
  {
    id: 1,
    name: "H3N2 Influenza",
    severity: "HIGH",
    cases: 142,
    zones: ["Zone 4", "Zone 7"],
    updated: "2h ago",
    symptoms: ["Fever", "Cough", "Sore throat", "Muscle aches"],
  },
  {
    id: 2,
    name: "Dengue Fever",
    severity: "MEDIUM",
    cases: 38,
    zones: ["Zone 2"],
    updated: "5h ago",
    symptoms: [
      "High fever",
      "Severe headache",
      "Joint and muscle pain",
      "Rash",
    ],
  },
  {
    id: 3,
    name: "Common Cold Outbreak",
    severity: "LOW",
    cases: 290,
    zones: ["Zone 1", "Zone 3", "Zone 5"],
    updated: "1d ago",
    symptoms: ["Runny nose", "Sneezing", "Mild cough", "Congestion"],
  },
];

const cities = ["Delhi", "Mumbai", "Ludhiana"];

const severityColors = {
  HIGH: "bg-red-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-green-500 text-white",
};

const bgColors = {
  HIGH: "bg-red-50 border-red-100",
  MEDIUM: "bg-yellow-50 border-yellow-100",
  LOW: "bg-green-50 border-green-100",
};

/**
 * Normalize a backend alert object into the shape the UI expects.
 * The backend returns { _id, title, severity: "high", affectedZones, ... }
 * The UI expects  { id, name, severity: "HIGH", zones, cases, updated, symptoms }
 */
function normalizeAlert(raw, index) {
  return {
    id: raw._id || raw.id || index + 1,
    name: raw.title || raw.name || "Unknown Alert",
    severity: (raw.severity || "low").toUpperCase(),
    cases: raw.cases ?? raw.caseCount ?? 0,
    zones: raw.affectedZones || raw.zones || [],
    updated:
      raw.updated || raw.updatedAt ? formatTimeAgo(raw.updatedAt) : "recently",
    symptoms: raw.symptoms || raw.commonSymptoms || [],
    message: raw.message || null,
  };
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "recently";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "recently";
  }
}

export default function DiseaseAlerts() {
  const [selectedCity, setSelectedCity] = useState("Ludhiana");
  const [filter, setFilter] = useState("All");
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [alertsData, setAlertsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch alerts from backend whenever the selected city changes
  useEffect(() => {
    let cancelled = false;

    async function fetchAlerts() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/public/disease-alerts?city=${encodeURIComponent(selectedCity)}`,
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) {
            setAlertsData(data.map(normalizeAlert));
          } else {
            // API returned empty array — use fallback so the page isn't blank
            setAlertsData(FALLBACK_ALERTS);
          }
        }
      } catch (err) {
        console.warn(
          "Failed to fetch disease alerts, using fallback data:",
          err.message,
        );
        if (!cancelled) {
          setAlertsData(FALLBACK_ALERTS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAlerts();
    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  // Real-time socket listener for new alerts published by admin
  useEffect(() => {
    const socket = createSocket();

    socket.on("alert:published", (newAlert) => {
      const normalized = normalizeAlert(newAlert);
      setAlertsData((prev) => [normalized, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredAlerts = alertsData.filter((alert) =>
    filter === "All" ? true : alert.severity === filter.toUpperCase(),
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Active Disease Alerts
            </h1>
            <p className="mt-2 text-gray-500">
              Monitor local health risks and active disease outbreaks in your
              area.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="appearance-none bg-indigo-50 border border-indigo-100 text-indigo-700 py-3 pl-4 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-700">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {["All", "High", "Medium", "Low"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-md transform scale-105"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {f} Severity
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 font-medium">
              Loading alerts for {selectedCity}...
            </p>
          </div>
        )}

        {/* Alert Cards Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAlerts.map((alert) => {
              const isExpanded = expandedCardId === alert.id;

              return (
                <div
                  key={alert.id}
                  onClick={() =>
                    setExpandedCardId(isExpanded ? null : alert.id)
                  }
                  className={`group cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden ${bgColors[alert.severity] || "bg-gray-50 border-gray-100"} ${
                    isExpanded
                      ? "shadow-lg scale-[1.02] z-10"
                      : "shadow-sm hover:shadow-md hover:-translate-y-1"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {alert.name}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${severityColors[alert.severity] || "bg-gray-400 text-white"}`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-700 bg-white/50 p-2 rounded-lg">
                        <svg
                          className="w-5 h-5 text-indigo-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className="font-semibold">
                          {alert.cases}{" "}
                          <span className="text-xs font-normal text-gray-500">
                            cases
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 bg-white/50 p-2 rounded-lg">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm">{alert.updated}</span>
                      </div>
                    </div>

                    {/* Show alert message if present from backend */}
                    {alert.message && (
                      <p className="text-sm text-gray-600 mb-3 italic">
                        {alert.message}
                      </p>
                    )}

                    <div className="flex items-start gap-2 text-gray-600 mb-2">
                      <svg
                        className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
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
                      <div className="text-sm">
                        <span className="font-medium text-gray-800">
                          Affected Zones:{" "}
                        </span>
                        {alert.zones.length > 0
                          ? alert.zones.join(", ")
                          : "City-wide"}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Section */}
                  <div
                    className={`bg-white border-t border-gray-100 transition-all duration-300 ease-in-out ${
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="p-6">
                      {alert.symptoms && alert.symptoms.length > 0 ? (
                        <>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-indigo-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Common Symptoms
                          </h4>
                          <ul className="grid grid-cols-2 gap-2">
                            {alert.symptoms.map((symptom, idx) => (
                              <li
                                key={idx}
                                className="flex items-center gap-2 text-sm text-gray-600"
                              >
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                                {symptom}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No symptom data available for this alert.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Expand Indicator */}
                  <div className="bg-white/40 border-t border-black/5 flex justify-center py-2 items-center text-gray-500 group-hover:bg-white/60 transition-colors">
                    <span className="text-xs font-medium mr-1">
                      {isExpanded ? "Show less" : "Click to expand"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredAlerts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">
              No alerts found
            </h3>
            <p className="mt-1 text-gray-500">
              There are no active alerts matching your filter criteria.
            </p>
            <button
              onClick={() => setFilter("All")}
              className="mt-4 px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
