import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Simple mock data for alerts (re-used for the latest alert section)
const alertsData = [
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

export default function LandingPage() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  const username = useMemo(() => {
    // Attempt to decode a JWT from localStorage for the username
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Very basic manual decoding of JWT payload (base64url to JSON object)
        const payloadBase64 = token.split(".")[1];
        if (payloadBase64) {
          const decodedJson = atob(payloadBase64);
          const decodedObj = JSON.parse(decodedJson);
          if (decodedObj && decodedObj.name) {
            return decodedObj.name.split(" ")[0]; // Get first name
          } else if (decodedObj && decodedObj.username) {
            return decodedObj.username;
          }
        }
      } catch (err) {
        console.error("Failed to decode token", err);
        return "User";
      }
    }
    // Fallback for demo purposes if no token
    return "Alex";
  }, []);

  const handleComingSoon = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const latestAlert = alertsData[0]; // Take the first one for the "Latest Alert" section

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12 relative overflow-hidden">
      {/* Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${showToast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}
      >
        <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2">
          <svg
            className="w-5 h-5 text-indigo-400"
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
          Coming Soon!
        </div>
      </div>

      <div className="max-w-md mx-auto sm:max-w-2xl lg:max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Hello, {username}{" "}
              <span className="inline-block animate-wave origin-bottom-right">
                👋
              </span>
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              How can we help you today?
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-sm border border-indigo-200">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* SOS Button Section */}
        <div className="relative flex justify-center py-8">
          {/* Pulse Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 bg-red-400 rounded-full opacity-20 animate-ping absolute"></div>
            <div className="w-40 h-40 bg-red-500 rounded-full opacity-30 animate-pulse absolute"></div>
          </div>

          <button
            onClick={() => navigate("/request-ambulance")}
            className="relative z-10 w-40 h-40 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.5)] border-4 border-white flex flex-col items-center justify-center text-white transform hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <svg
              className="w-12 h-12 mb-1"
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
            <span className="font-extrabold text-2xl tracking-wider">SOS</span>
          </button>
        </div>

        {/* Quick Stats Row */}
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-2">
          <div className="flex-none w-64 sm:w-auto bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
              <svg
                className="w-6 h-6"
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
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">3</p>
              <p className="text-sm font-semibold text-gray-500 mt-1">
                Active Alerts Near You
              </p>
            </div>
          </div>

          <div className="flex-none w-64 sm:w-auto bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <svg
                className="w-6 h-6"
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
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">
                2.1<span className="text-lg">km</span>
              </p>
              <p className="text-sm font-semibold text-gray-500 mt-1">
                Nearest Hospital
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/alerts")}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all text-left group flex flex-col justify-between h-36"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🦠</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Disease Alerts</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                View local outbreaks
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/symptoms")}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:teal-200 transition-all text-left group flex flex-col justify-between h-36"
          >
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🩺</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Check Symptoms</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Self-diagnosis tool
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/request-ambulance")}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-red-200 transition-all text-left group flex flex-col justify-between h-36"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🚑</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Call Ambulance</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Emergency request
              </p>
            </div>
          </button>

          <button
            onClick={handleComingSoon}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group flex flex-col justify-between h-36 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-gray-100 text-gray-500 text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg">
              Soon
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform grayscale opacity-70">
              <span className="text-2xl">📍</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-500">Nearby Hospitals</h3>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                Find closest clinics
              </p>
            </div>
          </button>
        </div>

        {/* Latest Alert Preview */}
        <div className="pt-4">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-gray-900">Latest Alert</h2>
            <button
              onClick={() => navigate("/alerts")}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View All
            </button>
          </div>

          <div
            onClick={() => navigate("/alerts")}
            className={`cursor-pointer rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${bgColors[latestAlert.severity]}`}
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900">
                  {latestAlert.name}
                </h3>
                <span
                  className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md shadow-sm ${severityColors[latestAlert.severity]}`}
                >
                  {latestAlert.severity}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <svg
                    className="w-4 h-4 text-indigo-500"
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
                    {latestAlert.cases}{" "}
                    <span className="font-normal text-gray-500">cases</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <svg
                    className="w-4 h-4 text-red-500"
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
                  <span className="font-medium text-gray-600 truncate max-w-[120px] sm:max-w-none">
                    {latestAlert.zones.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tailwind specific custom animations mapped directly in class string (requires standard tailwind setup or just using arbitrary values)
          Using built-in 'animate-ping' and 'animate-pulse' for the SOS button above.
          For the waving hand:
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes wave {
          0% { transform: rotate(0.0deg) }
          10% { transform: rotate(14.0deg) }
          20% { transform: rotate(-8.0deg) }
          30% { transform: rotate(14.0deg) }
          40% { transform: rotate(-4.0deg) }
          50% { transform: rotate(10.0deg) }
          60% { transform: rotate(0.0deg) }
          100% { transform: rotate(0.0deg) }
        }
        .animate-wave { animation: wave 2.5s infinite; transform-origin: 70% 70%; }
      `,
        }}
      />
    </div>
  );
}
