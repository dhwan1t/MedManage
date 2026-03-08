import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const CONSCIOUSNESS_LEVELS = ["Alert", "Voice", "Pain", "Unresponsive"];
const CHIEF_COMPLAINTS = [
  "Chest Pain",
  "Trauma",
  "Stroke",
  "Breathing",
  "Other",
];
const KNOWN_CONDITIONS = ["Diabetes", "Hypertension", "Heart Disease", "None"];

export default function PatientVitalsForm() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { authHeaders } = useAuth();

  const [formData, setFormData] = useState({
    heartRate: "",
    systolicBP: "",
    diastolicBP: "",
    respiratoryRate: "",
    temperature: "",
    spO2: "",
    consciousness: "",
    chiefComplaint: "",
    age: "",
    conditions: [],
    onSupplementalOxygen: false,
    facialDroop: false,
    armDrift: false,
    speechAbnormality: false,
    nursingHomeResident: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");
  const [showScoreReveal, setShowScoreReveal] = useState(false);
  const [severityData, setSeverityData] = useState(null);

  // After score reveal, navigate to recommendations after 3 seconds
  useEffect(() => {
    if (showScoreReveal && severityData) {
      const timer = setTimeout(() => {
        navigate(`/ambulance/recommendations/${caseId}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showScoreReveal, severityData, navigate, caseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorStatus) setErrorStatus("");
  };

  const handleConditionToggle = (condition) => {
    if (condition === "None") {
      setFormData((prev) => ({ ...prev, conditions: ["None"] }));
      return;
    }
    setFormData((prev) => {
      const newConditions = prev.conditions.filter((c) => c !== "None");
      return {
        ...prev,
        conditions: newConditions.includes(condition)
          ? newConditions.filter((c) => c !== condition)
          : [...newConditions, condition],
      };
    });
    if (errorStatus) setErrorStatus("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorStatus("");

    const targetCaseId = caseId;

    if (!targetCaseId) {
      setErrorStatus(
        "No case ID provided. Please go back to the dashboard and select a case.",
      );
      setIsSubmitting(false);
      return;
    }

    // Helper: build payload and submit
    const submitVitals = async (lat, lng) => {
      // Build the payload with the field names the server expects
      // (the server maps systolicBP→systolic, diastolicBP→diastolic, spO2→oxygenSat)
      const payload = {
        heartRate: formData.heartRate,
        systolicBP: formData.systolicBP,
        diastolicBP: formData.diastolicBP,
        respiratoryRate: formData.respiratoryRate,
        temperature: formData.temperature,
        spO2: formData.spO2,
        consciousness: formData.consciousness,
        chiefComplaint: formData.chiefComplaint,
        age: formData.age,
        conditions: formData.conditions,
        patientLat: lat,
        patientLng: lng,
        onSupplementalOxygen: formData.onSupplementalOxygen,
        facialDroop: formData.facialDroop,
        armDrift: formData.armDrift,
        speechAbnormality: formData.speechAbnormality,
        nursingHomeResident: formData.nursingHomeResident,
      };

      try {
        const response = await fetch(
          `/api/cases/${targetCaseId}/update-vitals`,
          {
            method: "PUT",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          setErrorStatus(
            errData.msg || "Failed to submit vitals. Please try again.",
          );
          setIsSubmitting(false);
          return;
        }

        // Success — show score reveal overlay before navigating
        const resData = await response.json().catch(() => ({}));
        const sev =
          resData.severity ||
          (resData.patient && resData.patient.severity) ||
          null;
        setSeverityData(sev);
        setShowScoreReveal(true);
      } catch (err) {
        console.error("Vitals submission error:", err);
        setErrorStatus("Network error. Make sure the server is running.");
      } finally {
        setIsSubmitting(false);
      }
    };

    // Attempt to get GPS coordinates; fall back to Ludhiana defaults
    const DEFAULT_LAT = 30.9;
    const DEFAULT_LNG = 75.85;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          submitVitals(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Geolocation denied or errored — use fallback
          console.warn(
            "Geolocation unavailable, using Ludhiana default coords",
          );
          submitVitals(DEFAULT_LAT, DEFAULT_LNG);
        },
        { timeout: 5000, maximumAge: 60000 },
      );
    } else {
      // Browser doesn't support geolocation — use fallback
      console.warn("Geolocation not supported, using Ludhiana default coords");
      submitVitals(DEFAULT_LAT, DEFAULT_LNG);
    }
  };

  // Severity level color helpers
  const getSeverityColor = (level) => {
    const l = (level || "").toLowerCase();
    if (l === "critical")
      return {
        bg: "bg-red-500",
        text: "text-red-500",
        ring: "ring-red-500/30",
      };
    if (l === "urgent")
      return {
        bg: "bg-orange-500",
        text: "text-orange-500",
        ring: "ring-orange-500/30",
      };
    return {
      bg: "bg-green-500",
      text: "text-green-500",
      ring: "ring-green-500/30",
    };
  };

  // Score reveal overlay
  if (showScoreReveal && severityData) {
    const colors = getSeverityColor(severityData.level);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Checkmark */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900">
            AI Analysis Complete
          </h2>

          {/* Score */}
          <div
            className={`inline-flex items-center justify-center w-28 h-28 rounded-full ring-8 ${colors.ring} ${colors.bg}/10`}
          >
            <span className={`text-5xl font-black ${colors.text}`}>
              {severityData.score ?? "—"}
            </span>
          </div>

          {/* Level badge */}
          <div>
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-white text-sm font-bold uppercase tracking-widest ${colors.bg}`}
            >
              {(severityData.level || "stable").toUpperCase()}
            </span>
          </div>

          {/* Flags */}
          {severityData.flags && severityData.flags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {severityData.flags.slice(0, 3).map((flag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full border border-gray-200"
                >
                  ⚠ {flag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {/* Loading next step */}
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm font-medium pt-2">
            <svg
              className="animate-spin h-4 w-4 text-indigo-500"
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
            Loading hospital recommendations...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-indigo-600 text-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Enter Patient Vitals
            </h1>
            <p className="text-indigo-100 font-medium text-sm mt-1">
              Case ID: {caseId || "No case selected"}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error Alert */}
        {errorStatus && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 animate-fadeIn">
            <p className="font-bold">Error</p>
            <p className="text-sm">{errorStatus}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 sm:p-8 space-y-8"
        >
          {/* Section 1: Basic Stats */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
              Patient Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max="120"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Years"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">
                  Chief Complaint <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  name="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400"
                >
                  <option value="" disabled>
                    Select complaint
                  </option>
                  {CHIEF_COMPLAINTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Core Vitals */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
              Core Vitals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">
                  Heart Rate <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="0"
                    max="300"
                    name="heartRate"
                    value={formData.heartRate}
                    onChange={handleChange}
                    className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white placeholder-gray-400"
                    placeholder="40-200"
                  />
                  <span className="absolute right-3 top-3 text-gray-400 text-xs font-bold pt-1">
                    BPM
                  </span>
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-bold text-gray-700">
                  Blood Pressure <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    required
                    type="number"
                    name="systolicBP"
                    value={formData.systolicBP}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-center text-gray-900 bg-white placeholder-gray-400"
                    placeholder="120"
                  />
                  <span className="text-gray-400 font-bold text-xl">/</span>
                  <input
                    required
                    type="number"
                    name="diastolicBP"
                    value={formData.diastolicBP}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-center text-gray-900 bg-white placeholder-gray-400"
                    placeholder="80"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">
                  Resp. Rate <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="0"
                    max="60"
                    name="respiratoryRate"
                    value={formData.respiratoryRate}
                    onChange={handleChange}
                    className="w-full p-3 pr-10 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white placeholder-gray-400"
                    placeholder="12-20"
                  />
                  <span className="absolute right-3 top-3 text-gray-400 text-xs font-bold pt-1">
                    /MIN
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">
                  Temperature <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    step="0.1"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    className="w-full p-3 pr-8 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white placeholder-gray-400"
                    placeholder="37.0"
                  />
                  <span className="absolute right-3 top-3 text-gray-400 text-sm font-bold pt-0.5">
                    °C
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">
                  SpO2 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    name="spO2"
                    value={formData.spO2}
                    onChange={handleChange}
                    className="w-full p-3 pr-8 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white placeholder-gray-400"
                    placeholder="95-100"
                  />
                  <span className="absolute right-3 top-3 text-gray-400 text-sm font-bold pt-0.5">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Assessment */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
              Assessment
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Consciousness Level (AVPU){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {CONSCIOUSNESS_LEVELS.map((level) => (
                    <label
                      key={level}
                      className={`flex-1 min-w-[120px] p-3 border rounded-xl cursor-pointer transition-colors text-center ${formData.consciousness === level ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold" : "hover:bg-gray-50 border-gray-200 text-gray-900 font-medium"}`}
                    >
                      <input
                        required
                        type="radio"
                        name="consciousness"
                        value={level}
                        checked={formData.consciousness === level}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-sm font-bold text-gray-700">
                  Known Conditions <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  Select all that apply.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {KNOWN_CONDITIONS.map((condition) => (
                    <label
                      key={condition}
                      className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.conditions.includes(condition) ? "bg-indigo-50 border-indigo-500" : "hover:bg-gray-50 border-gray-200"} text-gray-900`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.conditions.includes(condition)}
                        onChange={() => handleConditionToggle(condition)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {condition}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Extended Assessment */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
              Extended Assessment
            </h2>

            <div className="space-y-6">
              {/* Supplemental Oxygen Toggle */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                <label className="text-sm font-bold text-gray-700">
                  Supplemental Oxygen?
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      onSupplementalOxygen: !prev.onSupplementalOxygen,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.onSupplementalOxygen ? "bg-indigo-600" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.onSupplementalOxygen ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {/* Nursing Home Resident Toggle */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                <label className="text-sm font-bold text-gray-700">
                  Nursing Home Resident?
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      nursingHomeResident: !prev.nursingHomeResident,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.nursingHomeResident ? "bg-indigo-600" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.nursingHomeResident ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {/* Stroke Screening (CPSS) */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Stroke Screening (CPSS){" "}
                  <span className="text-xs font-medium text-gray-400">
                    — optional
                  </span>
                </label>
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  Check any signs observed.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.facialDroop ? "bg-indigo-50 border-indigo-500" : "hover:bg-gray-50 border-gray-200"} text-gray-900`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.facialDroop}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          facialDroop: !prev.facialDroop,
                        }))
                      }
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Facial Droop?
                    </span>
                  </label>
                  <label
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.armDrift ? "bg-indigo-50 border-indigo-500" : "hover:bg-gray-50 border-gray-200"} text-gray-900`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.armDrift}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          armDrift: !prev.armDrift,
                        }))
                      }
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Arm Drift?
                    </span>
                  </label>
                  <label
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${formData.speechAbnormality ? "bg-indigo-50 border-indigo-500" : "hover:bg-gray-50 border-gray-200"} text-gray-900`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.speechAbnormality}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          speechAbnormality: !prev.speechAbnormality,
                        }))
                      }
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Speech Abnormality?
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting || formData.conditions.length === 0}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Processing Vitals...
                </>
              ) : (
                "Submit Vitals & Get Reccomendation"
              )}
            </button>
          </div>
        </form>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800 mt-6 shadow-sm">
          <svg
            className="w-6 h-6 flex-shrink-0 text-blue-500 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium leading-relaxed">
            These vitals will be scored using{" "}
            <span className="font-bold">
              MEWS, Shock Index, and GCS algorithms
            </span>{" "}
            to determine patient severity and recommend the best hospital.
          </p>
        </div>
      </div>
    </div>
  );
}
