import React, { useState, useEffect, useMemo } from "react";
import ThemeToggle from "../../components/shared/ThemeToggle";
import { useAuth } from "../../context/useAuth";

// --- MOCK DATA ---

const MOCK_HOSPITALS = [
  {
    id: "h1",
    name: "City Medical Center",
    type: "Private",
    rating: 4.8,
    reviews: 245,
    casesHandled: 1240,
    avgResponse: 5.2, // mins
    survivalRate: 98.4, // %
    occupancy: 82, // %
    breakdown: {
      admission: 4.9,
      staff: 4.8,
      facility: 4.7,
      communication: 4.8,
    },
    feedback: [
      "Incredible trauma team. Saved my husband's life after a severe car crash.",
      "Very fast response time, but the waiting area was a bit crowded.",
      "The nursing staff was exceptionally compassionate and attentive.",
    ],
  },
  {
    id: "h2",
    name: "Civil Hospital",
    type: "Govt",
    rating: 3.8,
    reviews: 512,
    casesHandled: 3100,
    avgResponse: 8.5,
    survivalRate: 94.2,
    occupancy: 98,
    breakdown: {
      admission: 3.2,
      staff: 4.0,
      facility: 3.5,
      communication: 3.9,
    },
    feedback: [
      "Overcrowded but the doctors do their absolute best with limited resources.",
      "Bed availability is always an issue here during peak hours.",
      "The treatment is practically free which is a lifesaver, but expect delays.",
    ],
  },
  {
    id: "h3",
    name: "Fortis Escorts Hospital",
    type: "Private",
    rating: 4.5,
    reviews: 180,
    casesHandled: 850,
    avgResponse: 6.8,
    survivalRate: 97.5,
    occupancy: 75,
    breakdown: {
      admission: 4.6,
      staff: 4.5,
      facility: 4.8,
      communication: 4.1,
    },
    feedback: [
      "State of the art facilities and very clean.",
      "Communication regarding the billing process could be more transparent.",
      "Excellent post-operative care and attentive ward boys.",
    ],
  },
  {
    id: "h4",
    name: "DMC Hospital",
    type: "Trust",
    rating: 4.9,
    reviews: 890,
    casesHandled: 4200,
    avgResponse: 4.1,
    survivalRate: 99.1,
    occupancy: 88,
    breakdown: {
      admission: 4.9,
      staff: 4.9,
      facility: 4.8,
      communication: 4.9,
    },
    feedback: [
      "The absolute best care in the region. Flawless ER coordination.",
      "Dr. Sharma's surgical team was prompt and brilliant.",
      "AI routing got the ambulance here exactly as the OR was prepped. Incredible.",
    ],
  },
  {
    id: "h5",
    name: "Guru Nanak Mission",
    type: "Trust",
    rating: 4.2,
    reviews: 320,
    casesHandled: 1560,
    avgResponse: 7.4,
    survivalRate: 95.8,
    occupancy: 91,
    breakdown: {
      admission: 4.0,
      staff: 4.4,
      facility: 4.1,
      communication: 4.3,
    },
    feedback: [
      "Very charitable and helpful for low-income patients.",
      "Sometimes understaffed at night, but genuine care.",
      "The ICU doctors were very communicative with our family.",
    ],
  },
  {
    id: "h6",
    name: "Max Super Speciality",
    type: "Private",
    rating: 4.6,
    reviews: 155,
    casesHandled: 920,
    avgResponse: 5.9,
    survivalRate: 98.0,
    occupancy: 70,
    breakdown: {
      admission: 4.7,
      staff: 4.5,
      facility: 4.9,
      communication: 4.4,
    },
    feedback: [
      "Premium care but very expensive. Facilities are hotel-like.",
      "The ER admission was seamless and fast.",
      "Specialists were readily available on call during the weekend.",
    ],
  },
];

// --- COMPONENT ---

const HospitalRatings = () => {
  const { authHeaders } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [expandedId, setExpandedId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [hospitals, setHospitals] = useState(MOCK_HOSPITALS);

  // ── Webhook integration state ──
  const [integrationExpandedId, setIntegrationExpandedId] = useState(null);
  const [webhookData, setWebhookData] = useState({});
  const [webhookTestStatus, setWebhookTestStatus] = useState({});
  const [webhookSaving, setWebhookSaving] = useState({});

  const getWebhook = (hospitalId) =>
    webhookData[hospitalId] || { webhookUrl: "", webhookEnabled: false };

  const setWebhookField = (hospitalId, field, value) => {
    setWebhookData((prev) => ({
      ...prev,
      [hospitalId]: { ...getWebhook(hospitalId), [field]: value },
    }));
  };

  const fetchWebhookConfig = async (hospitalId) => {
    try {
      const res = await fetch(`/api/admin/hospitals/${hospitalId}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setWebhookData((prev) => ({
          ...prev,
          [hospitalId]: {
            webhookUrl: data.webhookUrl || "",
            webhookEnabled: !!data.webhookEnabled,
          },
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch webhook config:", err.message);
    }
  };

  const handleWebhookSave = async (hospitalId) => {
    setWebhookSaving((prev) => ({ ...prev, [hospitalId]: true }));
    try {
      const wh = getWebhook(hospitalId);
      const res = await fetch(`/api/admin/hospitals/${hospitalId}/webhook`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          webhookUrl: wh.webhookUrl,
          webhookEnabled: wh.webhookEnabled,
        }),
      });
      if (res.ok) {
        setToastMsg("Webhook configuration saved");
      } else {
        const errData = await res.json().catch(() => ({}));
        setToastMsg(errData.msg || "Failed to save webhook config");
      }
    } catch {
      setToastMsg("Network error saving webhook config");
    } finally {
      setWebhookSaving((prev) => ({ ...prev, [hospitalId]: false }));
    }
  };

  const handleWebhookTest = async (hospitalId) => {
    setWebhookTestStatus((prev) => ({ ...prev, [hospitalId]: "testing" }));
    try {
      const res = await fetch(
        `/api/admin/hospitals/${hospitalId}/webhook/test`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setWebhookTestStatus((prev) => ({ ...prev, [hospitalId]: "success" }));
      } else {
        setWebhookTestStatus((prev) => ({ ...prev, [hospitalId]: "failed" }));
      }
    } catch {
      setWebhookTestStatus((prev) => ({ ...prev, [hospitalId]: "failed" }));
    }
    setTimeout(() => {
      setWebhookTestStatus((prev) => ({ ...prev, [hospitalId]: null }));
    }, 5000);
  };

  // Fetch real hospital data on mount
  useEffect(() => {
    async function fetchHospitals() {
      try {
        const res = await fetch("/api/admin/hospitals", {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((h, i) => ({
            id: h.id || h._id || `h${i}`,
            name: h.name || "Unknown",
            type:
              h.type === "govt"
                ? "Govt"
                : h.type === "private"
                  ? "Private"
                  : h.type === "trust"
                    ? "Trust"
                    : h.type || "Govt",
            rating: h.rating || 0,
            reviews: h.reviews || 0,
            casesHandled: h.totalCases || h.casesHandled || 0,
            avgResponse: h.avgResponseTime || h.avgResponse || 0,
            survivalRate: h.survivalRate || 95.0,
            occupancy: h.occupancy || 0,
            breakdown: h.breakdown || {
              admission: 4.0,
              staff: 4.0,
              facility: 4.0,
              communication: 4.0,
            },
            feedback: h.feedback || ["No feedback available yet."],
          }));
          setHospitals(mapped);
        }
      } catch (err) {
        console.warn(
          "Failed to fetch hospitals, using mock data:",
          err.message,
        );
        // Keep MOCK_HOSPITALS as fallback (already set as initial state)
      }
    }
    fetchHospitals();
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const showActionToast = (action, hospitalName) => {
    setToastMsg(`Action: "${action}" executed for ${hospitalName}`);
  };

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...hospitals];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(q));
    }

    // 2. Sort
    result.sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating; // Descending
      if (sortBy === "cases") return b.casesHandled - a.casesHandled; // Descending
      if (sortBy === "response") return a.avgResponse - b.avgResponse; // Ascending (lower is better)
      return 0; // fallback
    });

    return result;
  }, [searchQuery, sortBy, hospitals]);

  // Determine top performer (highest rating overall, independent of search filter)
  const topPerformerId = useMemo(() => {
    const sortedByRating = [...hospitals].sort((a, b) => b.rating - a.rating);
    return sortedByRating.length > 0 ? sortedByRating[0].id : null;
  }, [hospitals]);

  const renderStars = (rating) => {
    // Round to nearest 0.5 for visual display
    const rounded = Math.round(rating * 2) / 2;
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      if (i <= rounded) {
        // Full star
        stars.push(
          <span key={i} className="text-yellow-400">
            ★
          </span>,
        );
      } else if (i - 0.5 === rounded) {
        // Half star visually implemented with a trick or just use text
        stars.push(
          <span key={i} className="text-yellow-400 opacity-50 relative">
            <span className="absolute overflow-hidden w-1/2 left-0 top-0">
              ★
            </span>
            <span className="text-slate-200">★</span>
          </span>,
        );
      } else {
        // Empty star
        stars.push(
          <span key={i} className="text-slate-200">
            ★
          </span>,
        );
      }
    }
    return (
      <div
        className="flex text-lg items-center gap-0.5"
        aria-label={`Rating: ${rating} out of 5`}
      >
        {stars}
      </div>
    );
  };

  const getBadgeColor = (type) => {
    if (type === "Govt") return "bg-blue-100 text-blue-800 border-blue-200";
    if (type === "Private")
      return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200"; // Trust
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-4 border-b border-slate-200 dark:border-gray-700 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Hospital Performance & Feedback
            </h1>
            <p className="text-base font-medium text-slate-500 dark:text-gray-400 mt-1">
              Review network partner ratings and patient outcomes.
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Filter / Sort Controls */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by hospital name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 font-medium text-slate-700 dark:text-gray-300"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label
              htmlFor="sort"
              className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest"
            >
              Sort By:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-slate-200 dark:border-gray-700 rounded-lg text-slate-800 dark:text-gray-200 font-bold outline-none focus:border-indigo-500 bg-slate-50 dark:bg-gray-900 cursor-pointer"
            >
              <option value="rating">Highest Rating First</option>
              <option value="cases">Cases Handled (High-Low)</option>
              <option value="response">Response Time (Fast-Slow)</option>
            </select>
          </div>
        </div>

        {/* List View */}
        <div className="space-y-6">
          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-gray-400 font-medium bg-white dark:bg-gray-900 rounded-xl border border-dashed border-slate-300 dark:border-gray-600">
              <span className="text-4xl block mb-2">🏥</span>
              No hospitals match your search.
            </div>
          ) : (
            filteredAndSorted.map((hospital) => {
              const isTop = hospital.id === topPerformerId;
              const isExpanded = expandedId === hospital.id;

              return (
                <div
                  key={hospital.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm transition-all overflow-hidden relative
                    ${isTop ? "border-2 border-yellow-400 ring-4 ring-yellow-50" : "border border-slate-200 dark:border-gray-700"}
                  `}
                >
                  {/* Top Performer Banner */}
                  {isTop && (
                    <div className="bg-yellow-400 text-yellow-900 text-xs font-black uppercase tracking-widest py-1.5 px-4 flex items-center gap-2">
                      <span>⭐</span> OUTSTANDING: TOP PERFORMER THIS MONTH
                    </div>
                  )}

                  <div className="p-6">
                    {/* Upper Row: Title & Stars */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                            {hospital.name}
                          </h2>
                          <span
                            className={`border px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${getBadgeColor(hospital.type)}`}
                          >
                            {hospital.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {renderStars(hospital.rating)}
                          <span className="text-lg font-black text-slate-800 dark:text-gray-200">
                            {hospital.rating.toFixed(1)}
                          </span>
                          <span
                            className="text-sm font-medium text-slate-400 dark:text-gray-500 underline decoration-dotted underline-offset-4 cursor-help"
                            title="Aggregated from patient post-discharge surveys"
                          >
                            Based on {hospital.reviews} reviews
                          </span>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          onClick={() =>
                            showActionToast("Flag for Review", hospital.name)
                          }
                          className="px-4 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold text-sm rounded-lg transition-colors border border-slate-200 dark:border-gray-700 flex items-center gap-2"
                        >
                          <span>🚩</span> Flag
                        </button>
                        <button
                          onClick={() =>
                            showActionToast(
                              "Send Administrative Notice",
                              hospital.name,
                            )
                          }
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-lg transition-colors border border-indigo-200 flex items-center gap-2"
                        >
                          <span>✉️</span> Notice
                        </button>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800">
                      <div>
                        <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                          Total Cases
                        </div>
                        <div className="text-xl font-black text-slate-800 dark:text-gray-200">
                          {hospital.casesHandled.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                          Avg Response
                        </div>
                        <div className="text-xl font-black text-slate-800 dark:text-gray-200">
                          {hospital.avgResponse}{" "}
                          <span className="text-sm font-bold text-slate-400 dark:text-gray-500 ml-0.5">
                            min
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                          Survival Rate
                        </div>
                        <div className="text-xl font-black text-green-600">
                          {hospital.survivalRate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                          Occupancy
                        </div>
                        <div
                          className={`text-xl font-black ${hospital.occupancy >= 90 ? "text-red-500" : "text-slate-800 dark:text-gray-200"}`}
                        >
                          {hospital.occupancy}%
                        </div>
                      </div>
                    </div>

                    {/* Feedback Snippets */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                        <span>
                          Recent Patient Feedback (Verified ER Admissions)
                        </span>
                      </h3>
                      <div className="space-y-2 mb-4">
                        {hospital.feedback.map((comment, i) => (
                          <div
                            key={i}
                            className="text-sm text-slate-600 dark:text-gray-400 italic bg-white dark:bg-gray-900 border-l-4 border-slate-300 dark:border-gray-600 pl-3 py-1"
                          >
                            "{comment}"
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Breakdown Toggle */}
                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : hospital.id)
                        }
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors outline-none"
                      >
                        {isExpanded
                          ? "Hide Dimension Breakdown ▲"
                          : "Show Dimension Breakdown ▼"}
                      </button>
                      <button
                        onClick={() => {
                          const isIntOpen =
                            integrationExpandedId === hospital.id;
                          setIntegrationExpandedId(
                            isIntOpen ? null : hospital.id,
                          );
                          if (!isIntOpen && !webhookData[hospital.id]) {
                            fetchWebhookConfig(hospital.id);
                          }
                        }}
                        className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors outline-none"
                      >
                        🔗{" "}
                        {integrationExpandedId === hospital.id
                          ? "Hide Integration ▲"
                          : "External Integration ▼"}
                      </button>
                    </div>

                    {/* Expandable Breakdown Section */}
                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-slate-100 dark:border-gray-800 animate-in slide-in-from-top-2 fade-in duration-300">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-gray-200 uppercase tracking-widest mb-4">
                          Rating Dimensional Analysis (Out of 5)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                          {Object.entries({
                            "Speed of Admission": hospital.breakdown.admission,
                            "Staff Responsiveness": hospital.breakdown.staff,
                            "Facility Quality": hospital.breakdown.facility,
                            Communication: hospital.breakdown.communication,
                          }).map(([label, val]) => (
                            <div key={label}>
                              <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-bold text-slate-600 dark:text-gray-400">
                                  {label}
                                </span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                  {val.toFixed(1)}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-1000 ${val >= 4.5 ? "bg-green-500" : val >= 4.0 ? "bg-blue-500" : val >= 3.5 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{ width: `${(val / 5) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expandable Integration Section */}
                    {integrationExpandedId === hospital.id && (
                      <div className="mt-5 pt-5 border-t border-slate-100 dark:border-gray-800 animate-in slide-in-from-top-2 fade-in duration-300">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-gray-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <span>🔗</span> External Integration
                        </h4>
                        <div className="space-y-4">
                          {/* Webhook URL */}
                          <div>
                            <label className="block text-sm font-bold text-slate-600 dark:text-gray-400 mb-1">
                              Webhook URL
                            </label>
                            <input
                              type="url"
                              placeholder="https://hospital-system.example.com/api/webhook"
                              value={getWebhook(hospital.id).webhookUrl}
                              onChange={(e) =>
                                setWebhookField(
                                  hospital.id,
                                  "webhookUrl",
                                  e.target.value,
                                )
                              }
                              className="w-full px-4 py-2 border-2 border-slate-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500 font-medium text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-900"
                            />
                          </div>

                          {/* Enable Toggle */}
                          <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-gray-700 rounded-lg">
                            <label className="text-sm font-bold text-slate-600 dark:text-gray-400">
                              Enable Webhook
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setWebhookField(
                                  hospital.id,
                                  "webhookEnabled",
                                  !getWebhook(hospital.id).webhookEnabled,
                                )
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${getWebhook(hospital.id).webhookEnabled ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${getWebhook(hospital.id).webhookEnabled ? "translate-x-6" : "translate-x-1"}`}
                              />
                            </button>
                          </div>

                          {/* Actions + Test Status */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              onClick={() => handleWebhookSave(hospital.id)}
                              disabled={webhookSaving[hospital.id]}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-60"
                            >
                              {webhookSaving[hospital.id]
                                ? "Saving..."
                                : "Save"}
                            </button>
                            <button
                              onClick={() => handleWebhookTest(hospital.id)}
                              disabled={
                                webhookTestStatus[hospital.id] === "testing" ||
                                !getWebhook(hospital.id).webhookUrl
                              }
                              className="px-4 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold text-sm rounded-lg transition-colors border border-slate-200 dark:border-gray-700 disabled:opacity-60"
                            >
                              {webhookTestStatus[hospital.id] === "testing"
                                ? "Testing..."
                                : "Test Connection"}
                            </button>

                            {webhookTestStatus[hospital.id] === "success" && (
                              <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                                ✅ Connected
                              </span>
                            )}
                            {webhookTestStatus[hospital.id] === "failed" && (
                              <span className="text-sm font-bold text-red-600 flex items-center gap-1">
                                ❌ Connection failed
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 dark:text-gray-500 font-medium">
                            When enabled, MedManage will POST patient dispatch
                            data to this URL whenever an ambulance is routed to
                            this hospital.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Toast / Snackbar overlay */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-sm animate-in slide-in-from-bottom-5 fade-in z-50 flex items-center gap-3 border border-slate-700">
          <span className="text-green-400 text-lg">✓</span> {toastMsg}
        </div>
      )}
    </div>
  );
};

export default HospitalRatings;
