import React, { useState, useEffect } from "react";
import ThemeToggle from "../../components/shared/ThemeToggle";
import { createSocket } from "../../utils/socket";

// Map Dimensions constraint for relative SVGs
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 800;

// --- MOCK CONSTANTS ---

const MOCK_HOSPITALS = [
  { id: "h1", name: "City Med Center", x: 45, y: 35, status: "AVAILABLE" }, // Center-ish
  { id: "h2", name: "Fortis Escorts", x: 20, y: 70, status: "AT CAPACITY" }, // Bottom Left
  { id: "h3", name: "DMC Hospital", x: 75, y: 20, status: "AVAILABLE" }, // Top Right
  { id: "h4", name: "Civil Hospital", x: 80, y: 65, status: "EMERGENCY ONLY" }, // Bottom Right
  { id: "h5", name: "PGIMER", x: 30, y: 30, status: "AVAILABLE" }, // Top Left
];

const INITIAL_AMBULANCES = [
  {
    id: "AMB-204",
    status: "EN_ROUTE",
    x: 15,
    y: 85,
    targetHospital: "h1",
    eta: "5:42",
    caseId: "PT-9942",
    severity: "CRITICAL",
  },
  {
    id: "AMB-188",
    status: "EN_ROUTE",
    x: 90,
    y: 90,
    targetHospital: "h3",
    eta: "12:10",
    caseId: "PT-8811",
    severity: "URGENT",
  },
  {
    id: "AMB-302",
    status: "AVAILABLE",
    x: 50,
    y: 50,
    targetHospital: null,
    eta: null,
    caseId: null,
    severity: null,
  }, // Stationary
];

// --- COMPONENT ---

const LiveMap = () => {
  const [ambulances, setAmbulances] = useState(INITIAL_AMBULANCES);
  const [activeCaseId, setActiveCaseId] = useState(null);

  useEffect(() => {
    const socket = createSocket();

    // Simulate ambulance movement locally if socket isn't connected
    const moveTimer = setInterval(() => {
      setAmbulances((prev) =>
        prev.map((amb) => {
          if (amb.status !== "EN_ROUTE" || !amb.targetHospital) return amb;

          const target = MOCK_HOSPITALS.find(
            (h) => h.id === amb.targetHospital,
          );
          if (!target) return amb;

          // Vector math for linear interpolation toward target
          const dx = target.x - amb.x;
          const dy = target.y - amb.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // If close enough, snap to target (Arrived)
          if (distance < 1) {
            return {
              ...amb,
              x: target.x,
              y: target.y,
              status: "ARRIVED",
              eta: "Arrived",
            };
          }

          // Move slightly towards target
          const speed = 0.5; // percent per tick
          return {
            ...amb,
            x: amb.x + (dx / distance) * speed,
            y: amb.y + (dy / distance) * speed,
          };
        }),
      );
    }, 1000); // 1 tick per second

    socket.on("ambulance:eta_update", (data) => {
      // Overwrite local simulation with truth data if backend emits it
      setAmbulances((prev) =>
        prev.map((a) =>
          a.id === data.id ? { ...a, x: data.x, y: data.y, eta: data.eta } : a,
        ),
      );
    });

    return () => {
      clearInterval(moveTimer);
      socket.disconnect();
    };
  }, []);

  const getHospitalColor = (status) => {
    if (status === "AVAILABLE") return "bg-green-500 shadow-green-500/50";
    if (status === "AT CAPACITY") return "bg-red-500 shadow-red-500/50";
    return "bg-yellow-500 shadow-yellow-500/50"; // EMERGENCY ONLY
  };

  const activeCases = ambulances.filter((a) => a.status === "EN_ROUTE");

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 p-4 shrink-0 flex justify-between items-center z-20">
        <div>
          <h1 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-3">
            <span className="text-blue-400">📡</span> City Live Map
          </h1>
          <p className="text-slate-400 dark:text-gray-500 text-xs font-bold tracking-widest mt-1 uppercase">
            Real-Time Ambulance Logistics & Hospital Network
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex gap-4 text-xs font-bold bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700/50 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>{" "}
              Available Hosp
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>{" "}
              At Capacity
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></span>{" "}
              ER Only
            </div>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]">
                🚑
              </span>{" "}
              En Route
            </div>
            <div className="flex items-center gap-1.5 opacity-50">
              <span className="text-base leading-none grayscale">🚑</span>{" "}
              Standby/Idle
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT CANVAS (Map space) */}
        <div
          className="flex-1 relative bg-[#0f172a] overflow-hidden"
          style={{
            backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
            backgroundSize: "40px 40px",
          }}
        >
          {/* Subtle Grid Radar Glow */}
          <div className="absolute inset-0 bg-radial-gradient from-blue-900/10 via-transparent to-[#0f172a]"></div>

          {/* SVG Overlay for Routes */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_0_4px_rgba(96,165,250,0.5)] z-0"
            viewBox={`0 0 100 100`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="routeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {ambulances
              .filter((a) => a.status === "EN_ROUTE")
              .map((amb) => {
                const target = MOCK_HOSPITALS.find(
                  (h) => h.id === amb.targetHospital,
                );
                if (!target) return null;

                const isHighlighted = activeCaseId === amb.caseId;

                return (
                  <line
                    key={`route-${amb.id}`}
                    x1={`${amb.x}%`}
                    y1={`${amb.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke={isHighlighted ? "#FBBF24" : "url(#routeGradient)"}
                    strokeWidth={isHighlighted ? "0.4" : "0.2"}
                    strokeDasharray="1, 1"
                    className={`${isHighlighted ? "animate-pulse" : ""}`}
                  />
                );
              })}
          </svg>

          {/* Hospital Markers */}
          {MOCK_HOSPITALS.map((hospital) => (
            <div
              key={hospital.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10"
              style={{ left: `${hospital.x}%`, top: `${hospital.y}%` }}
            >
              <div className="relative">
                {/* Pulse Ring */}
                <div
                  className={`absolute -inset-2 rounded-full opacity-30 animate-ping ${getHospitalColor(hospital.status)}`}
                ></div>
                {/* Status Dot */}
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0f172a] shadow-lg z-10 ${getHospitalColor(hospital.status)}`}
                ></div>
                {/* Icon */}
                <div className="text-3xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform transition-transform group-hover:scale-125">
                  🏥
                </div>
              </div>
              {/* Label */}
              <div className="mt-2 text-[10px] font-bold tracking-widest uppercase bg-[#1e293b]/90 text-slate-300 border border-slate-600/50 px-2 py-0.5 rounded backdrop-blur shadow-xl text-center whitespace-nowrap">
                {hospital.name}
              </div>
            </div>
          ))}

          {/* Ambulance Markers */}
          {ambulances.map((amb) => {
            const isHighlighted = activeCaseId === amb.caseId;
            const isIdle = amb.status === "AVAILABLE";

            return (
              <div
                key={amb.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-linear z-20 ${isIdle ? "grayscale opacity-60" : ""}`}
                style={{ left: `${amb.x}%`, top: `${amb.y}%` }}
              >
                {/* Highlight Halo */}
                {isHighlighted && (
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl scale-[4] animate-pulse"></div>
                )}

                <div
                  className={`text-2xl drop-shadow-md relative
                  ${isHighlighted ? "drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] scale-125" : "drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"}
                `}
                >
                  🚑
                </div>
                <div
                  className={`mt-1 text-[9px] font-black tracking-widest flex flex-col items-center px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap border
                  ${isHighlighted ? "bg-yellow-500 text-yellow-950 border-yellow-400" : isIdle ? "bg-slate-700 text-slate-300 border-slate-600" : "bg-blue-600 text-white border-blue-400"}
                `}
                >
                  <span>{amb.id}</span>
                  {!isIdle && (
                    <span className="text-[8px] opacity-90">{amb.eta}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT SIDEBAR (Active Cases) */}
        <div className="w-80 bg-slate-800/90 backdrop-blur-md border-l border-slate-700/50 flex flex-col z-20 shrink-0 shadow-2xl">
          <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-900/40">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></span>
              Active Dispatches
            </h2>
            <p className="text-xs text-slate-400 dark:text-gray-500 font-medium mt-1 uppercase tracking-widest">
              {activeCases.length} Ambulances En Route
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeCases.map((amb) => {
              const hName = MOCK_HOSPITALS.find(
                (h) => h.id === amb.targetHospital,
              )?.name;
              const isSelected = activeCaseId === amb.caseId;
              const isCritical = amb.severity === "CRITICAL";

              return (
                <div
                  key={amb.id}
                  onClick={() =>
                    setActiveCaseId(isSelected ? null : amb.caseId)
                  }
                  className={`p-4 rounded-xl border border-slate-700/50 cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden group
                    ${isSelected ? "bg-slate-700 shadow-lg ring-2 ring-blue-500/50" : "bg-slate-800/50 hover:bg-slate-800"}
                  `}
                >
                  {/* Severity Banner */}
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${isCritical ? "bg-red-500" : "bg-orange-500"}`}
                  ></div>

                  <div className="flex justify-between items-start pl-2 mb-2">
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {amb.caseId}
                      </h3>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                        {amb.id}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow text-white uppercase tracking-widest
                          ${isCritical ? "bg-red-500/80" : "bg-orange-500/80"}
                       `}
                      >
                        {amb.severity}
                      </span>
                    </div>
                  </div>

                  <div className="pl-2 mt-3 flex justify-between items-end border-t border-slate-700/50 pt-2">
                    <div>
                      <div className="text-xs text-slate-400 dark:text-gray-500 font-medium">
                        Destination:
                      </div>
                      <div className="text-sm font-bold text-slate-300 truncate max-w-[140px]">
                        {hName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">
                        ETA
                      </div>
                      <div
                        className={`text-xl font-black font-mono tracking-tighter ${isSelected ? "text-yellow-400" : "text-slate-200"}`}
                      >
                        {amb.eta}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {activeCases.length === 0 && (
              <div className="text-center py-12 text-slate-500 dark:text-gray-400 font-medium border border-dashed border-slate-700 rounded-xl bg-slate-800/30">
                <span className="text-3xl block mb-2 opacity-50">⏸️</span>
                No active dispatches
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
