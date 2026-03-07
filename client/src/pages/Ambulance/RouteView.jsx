import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createSocket } from "../../utils/socket";

export default function RouteView() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  // Mock initial state
  const hospitalName = "City Central Hospital";
  const vitals = {
    hr: 110,
    bp: "140/90",
    spo2: 92,
  };

  // Countdown timer state
  const [etaSeconds, setEtaSeconds] = useState(8 * 60); // 8:00

  // Status check-ins
  const [statuses, setStatuses] = useState({
    notified: false,
    bed: false,
    team: false,
  });

  // Real-time bed status message
  const [bedMessage, setBedMessage] = useState(
    "Awaiting exact bed assignment...",
  );

  const [isArriving, setIsArriving] = useState(false);

  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Status Animation Effect
  useEffect(() => {
    const t1 = setTimeout(
      () => setStatuses((prev) => ({ ...prev, notified: true })),
      1500,
    );
    const t2 = setTimeout(
      () => setStatuses((prev) => ({ ...prev, bed: true })),
      3500,
    );
    const t3 = setTimeout(
      () => setStatuses((prev) => ({ ...prev, team: true })),
      5500,
    );

    // For demo purposes, after bed is reserved, update the message
    const t4 = setTimeout(() => {
      setBedMessage("ICU Bed 4 reserved.");
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Socket Connection for real-time updates
  useEffect(() => {
    const socket = createSocket({
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on("hospital:bed_update", (data) => {
      console.log("Bed update received:", data);
      if (data && data.message) {
        setBedMessage(data.message);
        setStatuses((prev) => ({ ...prev, bed: true }));
      }
    });

    return () => socket.disconnect();
  }, []);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleArrival = async () => {
    setIsArriving(true);
    try {
      // Mock API PUT call
      await fetch(`/api/cases/${caseId || "mock"}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "arrived" }),
      });

      // UX Delay
      await new Promise((r) => setTimeout(r, 1200));

      navigate("/ambulance/dashboard");
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
      navigate("/ambulance/dashboard"); // Fallback route
    } finally {
      setIsArriving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header Card */}
      <div className="bg-slate-900 text-white p-6 shadow-md z-10">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">
              En Route To
            </p>
            <h1 className="text-2xl font-bold">{hospitalName}</h1>
          </div>
          <div className="text-right flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <div>
              <p className="text-3xl font-mono font-bold tracking-tight text-white leading-none">
                {formatTime(etaSeconds)}
              </p>
              <p className="text-xs text-slate-400 font-medium uppercase mt-1">
                Est. Arrival
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex flex-col">
        {/* Map Placeholder */}
        <div className="bg-gray-200 rounded-2xl w-full h-48 sm:h-64 border-2 border-dashed border-gray-300 flex items-center justify-center relative shadow-inner overflow-hidden">
          {/* Faint grid overlay to look somewhat like a map placeholder */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
          <div className="text-center relative z-10 px-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <p className="font-bold text-gray-700">Map View</p>
            <p className="text-sm text-gray-500 mt-1">
              Integrate Google Maps here.
            </p>
          </div>
        </div>

        {/* Live Vitals Strip */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 divide-x divide-gray-100 flex items-center justify-between mt-2 relative overflow-hidden">
          {/* Subtle animated pulse in background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-red-100">
            <div className="h-full bg-red-400 w-1/3 rounded-r-full animate-[pulse_2s_ease-in-out_infinite_alternate] shadow-[0_0_10px_rgba(248,113,113,0.8)]"></div>
          </div>

          <div className="flex-1 text-center px-2 py-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Heart Rate
            </p>
            <p className="text-2xl font-black text-red-600 font-mono flex items-center justify-center gap-1.5">
              {vitals.hr}{" "}
              <span className="text-sm font-medium text-gray-400">bpm</span>
            </p>
          </div>
          <div className="flex-1 text-center px-2 py-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Blood Pres.
            </p>
            <p className="text-2xl font-black text-indigo-700 font-mono">
              {vitals.bp}
            </p>
          </div>
          <div className="flex-1 text-center px-2 py-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              SpO2
            </p>
            <p className="text-2xl font-black text-blue-600 font-mono flex items-center justify-center gap-1.5">
              {vitals.spo2} <span className="text-lg text-blue-400">%</span>
            </p>
          </div>
        </div>

        {/* Status Check-ins */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Dispatch Status
          </h2>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {/* Step 1 */}
            <div
              className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active transition-all duration-500 ease-out origin-left ${statuses.notified ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full border-4 border-white shrink-0 z-10 transition-colors duration-300 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${statuses.notified ? "bg-green-500" : "bg-gray-200"}`}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-green-50 border border-green-100 p-4 rounded-xl shadow-sm text-green-800">
                <h3 className="font-bold">Hospital Notified</h3>
                <p className="text-xs text-green-600 font-medium mt-1">
                  ETA transmitted successfully.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ease-out origin-left delay-100 ${statuses.bed ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full border-4 border-white shrink-0 z-10 transition-colors duration-300 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${statuses.bed ? "bg-green-500" : "bg-gray-200"}`}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-green-50 border border-green-100 p-4 rounded-xl shadow-sm text-green-800">
                <h3 className="font-bold">Bed Reserved</h3>
                <p className="text-xs text-green-600 font-medium mt-1">
                  {bedMessage}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ease-out origin-left delay-200 ${statuses.team ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full border-4 border-white shrink-0 z-10 transition-colors duration-300 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${statuses.team ? "bg-green-500" : "bg-gray-200"}`}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-green-50 border border-green-100 p-4 rounded-xl shadow-sm text-green-800">
                <h3 className="font-bold">ER Team Alerted</h3>
                <p className="text-xs text-green-600 font-medium mt-1">
                  Ready for patient handover.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="bg-white border-t border-gray-200 p-4 sm:p-6 sticky bottom-0 z-20">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={handleArrival}
            disabled={isArriving}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xl py-5 rounded-2xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
          >
            {isArriving ? (
              <>
                <svg
                  className="animate-spin h-6 w-6 text-white"
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
                Processing Handover...
              </>
            ) : (
              <>
                <svg
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8"
                  />
                </svg>
                EMERGENCY ARRIVED
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
