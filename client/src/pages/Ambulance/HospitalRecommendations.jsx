import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const MOCK_HOSPITALS = [
  {
    id: "H-001",
    name: "City Central Hospital",
    type: "Govt",
    distance: "3.2 km",
    eta: "~7 min",
    facilities: { icu: true, ot: true, er: true, bedsAvailable: 4 },
    doctorAvailability: "2 surgeons on duty",
    matchScore: 87,
    costEstimate: "~₹8,000–12,000",
    survivalProbability: 82,
  },
  {
    id: "H-002",
    name: "Apollo Lifeline",
    type: "Private",
    distance: "5.1 km",
    eta: "~12 min",
    facilities: { icu: true, ot: true, er: false, bedsAvailable: 2 },
    doctorAvailability: "1 surgeon on duty",
    matchScore: 74,
    costEstimate: "~₹25,000–35,000",
    survivalProbability: 65,
  },
  {
    id: "H-003",
    name: "Green Valley Clinic",
    type: "Private",
    distance: "1.5 km",
    eta: "~4 min",
    facilities: { icu: false, ot: false, er: true, bedsAvailable: 1 },
    doctorAvailability: "Emergency physician on duty",
    matchScore: 45,
    costEstimate: "~₹5,000–8,000",
    survivalProbability: 45, // Won't show if < 60
  },
];

export default function HospitalRecommendations() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { authHeaders } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [severityScore, setSeverityScore] = useState(0);
  const [isSelectingId, setIsSelectingId] = useState(null);
  const [_error, setError] = useState("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!caseId) {
        setError("No case ID provided. Please go back and select a case.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/cases/${caseId}/recommendation`, {
          headers: authHeaders(),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.msg || "Failed to fetch recommendations");
        }

        const data = await response.json();
        // Server returns { severity, severityScore, recommendations }
        const recs = data.recommendations || [];
        // Map server response fields to what the UI expects
        const mapped = recs.map((r) => ({
          id: r.hospitalId,
          name: r.name,
          type: r.type,
          distance: `${r.distance} km`,
          eta: `~${r.estimatedMinutes || Math.round(r.distance * 2.5 + 2)} min`,
          facilities: {
            icu: r.resources?.icuBeds?.available > 0,
            ot: r.resources?.otTheatres?.available > 0,
            er: r.resources?.erBays?.available > 0,
            bedsAvailable: r.resources?.generalBeds?.available || 0,
          },
          doctorAvailability: r.reason?.match(/(\d+) doctors/)
            ? r.reason.match(/(\d+) doctors/)[1] + " on duty"
            : "Available",
          matchScore: r.score,
          costEstimate:
            r.estimatedCost ||
            (r.type === "govt" ? "₹2,000–5,000" : "₹8,000–20,000"),
          survivalProbability: r.survivalProbability || 0,
        }));

        setHospitals(mapped.length > 0 ? mapped : MOCK_HOSPITALS);
        setSeverityScore(
          data.severityScore || (data.severity && data.severity.score) || 0,
        );
      } catch (err) {
        console.warn(
          "Recommendations fetch failed, using mock data:",
          err.message,
        );
        setHospitals(MOCK_HOSPITALS);
        setSeverityScore(82);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const handleSelectHospital = async (id) => {
    setIsSelectingId(id);
    try {
      const response = await fetch(`/api/cases/${caseId}/select-hospital`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ hospitalId: id }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.warn("Select hospital failed:", errData.msg);
      }

      // Navigate to the route view with caseId
      navigate(`/ambulance/route/${caseId}`);
    } catch (err) {
      console.error("Select hospital error:", err);
      // Still navigate — the route view has mock fallback
      navigate(`/ambulance/route/${caseId}`);
    } finally {
      setIsSelectingId(null);
    }
  };

  const getSeverityDetails = () => {
    if (severityScore <= 40)
      return {
        label: "STABLE",
        colorClass: "text-green-600 bg-green-50 border-green-200",
      };
    if (severityScore <= 70)
      return {
        label: "URGENT",
        colorClass: "text-orange-600 bg-orange-50 border-orange-200",
      };
    return {
      label: "CRITICAL",
      colorClass: "text-red-600 bg-red-50 border-red-200",
    };
  };

  const severityDetails = getSeverityDetails();

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="w-1/2 h-6 bg-gray-200 rounded"></div>
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      </div>
      <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="w-full h-10 bg-gray-100 rounded"></div>
        <div className="w-full h-10 bg-gray-100 rounded"></div>
      </div>
      <div className="w-full h-12 bg-gray-200 rounded-xl mt-4"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header & Severity Banner */}
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Hospital Recommendations
          </h1>
          <p className="text-gray-500 font-medium">
            Ranked options based on patient vitals, distance, and facility
            availability.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Main Score Box */}
            <div
              className={`p-6 rounded-2xl border flex-1 shadow-sm flex items-center gap-6 ${severityDetails.colorClass}`}
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-3xl font-black">{severityScore}</span>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest opacity-80">
                  Severity Score
                </p>
                <p className="text-3xl font-bold mt-1">
                  {severityDetails.label}
                </p>
              </div>
            </div>

            {/* Critical Alert Warning */}
            {severityScore > 75 && (
              <div className="sm:w-1/3 bg-red-600 text-white p-6 rounded-2xl shadow-md flex items-center justify-center text-center px-4 animate-fadeIn">
                <div>
                  <svg
                    className="w-8 h-8 mx-auto mb-2 text-red-200"
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
                  <p className="font-bold uppercase tracking-wider text-sm">
                    Fastest Route Recommended
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hospital List Area */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2">
            Matching Facilities
          </h2>

          {isLoading ? (
            <div className="space-y-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {hospitals.map((hospital, index) => {
                const rankColors = [
                  "bg-amber-100 text-amber-700 border-amber-200", // Gold
                  "bg-slate-200 text-slate-700 border-slate-300", // Silver
                  "bg-orange-100 text-orange-800 border-orange-200", // Bronze
                ];
                const rankColor =
                  rankColors[index] ||
                  "bg-gray-100 text-gray-600 border-gray-200";

                return (
                  <div
                    key={hospital.id}
                    className="bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                  >
                    <div className="p-6">
                      {/* Top Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4 items-start">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-sm font-black text-xl flex-shrink-0 ${rankColor}`}
                          >
                            #{index + 1}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 leading-none">
                              {hospital.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                {hospital.type}
                              </span>
                              <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                <svg
                                  className="w-4 h-4 text-indigo-400"
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
                                {hospital.distance} —{" "}
                                <span className="text-indigo-600 font-bold">
                                  {hospital.eta}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 ml-4 hidden sm:block">
                          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg flex flex-col items-center shadow-sm">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                              Match Score
                            </span>
                            <span className="text-xl font-bold leading-none">
                              {hospital.matchScore}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8"
                              />
                            </svg>
                            <span className="font-medium text-gray-600 w-24">
                              Facilities:
                            </span>
                            <div className="flex gap-2">
                              {hospital.facilities.icu && (
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100">
                                  ICU ✓
                                </span>
                              )}
                              {hospital.facilities.ot && (
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100">
                                  OT ✓
                                </span>
                              )}
                              {hospital.facilities.er && (
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100">
                                  ER ✓
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="font-medium text-gray-600 w-24">
                              Doctors:
                            </span>
                            <span className="font-semibold text-gray-900">
                              {hospital.doctorAvailability}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span className="font-medium text-gray-600 w-24">
                              Beds:
                            </span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {hospital.facilities.bedsAvailable} available
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 md:border-l border-gray-100 md:pl-4">
                          <div className="flex items-center gap-2 text-sm">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="font-medium text-gray-600">
                              Cost:
                            </span>
                            <span className="font-semibold text-gray-900">
                              {hospital.costEstimate}
                            </span>
                          </div>

                          {/* Conditionally render Survival Probability */}
                          {hospital.survivalProbability > 60 && (
                            <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-100 p-2 rounded-lg mt-2 inline-block">
                              <svg
                                className="w-5 h-5 text-green-500 inline mr-1"
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
                              <span className="font-bold text-green-700">
                                Survival chance: {hospital.survivalProbability}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 border-t border-gray-100 sm:flex sm:justify-between items-center hidden">
                      <p className="text-xs text-gray-500 font-medium ml-2">
                        Choosing this option will notify the hospital.
                      </p>
                      <button
                        onClick={() => handleSelectHospital(hospital.id)}
                        disabled={isSelectingId !== null}
                        className="w-full sm:w-auto mt-3 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSelectingId === hospital.id
                          ? "Assigning..."
                          : "Select This Hospital"}
                        {isSelectingId !== hospital.id && (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Mobile button visible on small screens */}
                    <div className="p-4 sm:hidden">
                      <button
                        onClick={() => handleSelectHospital(hospital.id)}
                        disabled={isSelectingId !== null}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSelectingId === hospital.id
                          ? "Assigning..."
                          : "Select This Hospital"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
