import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const DEMO_ACCOUNTS = [
  {
    role: "public",
    icon: "🌐",
    label: "Public User",
    description: "Request ambulances, check symptoms, view disease alerts",
    email: "public@mediroute.com",
    password: "pass123",
    redirect: "/",
    gradient: "from-emerald-500 to-teal-600",
    hoverGradient: "from-emerald-400 to-teal-500",
    shadow: "shadow-emerald-500/30",
    ring: "ring-emerald-400",
    iconBg: "bg-emerald-400/20",
    features: ["SOS Emergency Button", "Symptom Checker", "Disease Alerts"],
  },
  {
    role: "ambulance",
    icon: "🚑",
    label: "Ambulance Operator",
    description: "Manage dispatches, enter patient vitals, get hospital recs",
    email: "ambulance@mediroute.com",
    password: "pass123",
    redirect: "/ambulance",
    gradient: "from-blue-500 to-indigo-600",
    hoverGradient: "from-blue-400 to-indigo-500",
    shadow: "shadow-blue-500/30",
    ring: "ring-blue-400",
    iconBg: "bg-blue-400/20",
    features: [
      "Live Case Dashboard",
      "Vitals Entry Form",
      "AI Hospital Ranking",
    ],
  },
  {
    role: "hospital",
    icon: "🏥",
    label: "Hospital Staff",
    description: "Manage beds, track incoming patients, allocate resources",
    email: "hospital@mediroute.com",
    password: "pass123",
    redirect: "/hospital",
    gradient: "from-violet-500 to-purple-600",
    hoverGradient: "from-violet-400 to-purple-500",
    shadow: "shadow-violet-500/30",
    ring: "ring-violet-400",
    iconBg: "bg-violet-400/20",
    features: ["Bed Management", "Priority Queue", "Incoming Patient Alerts"],
    hospitals: [
      {
        name: "City Medical Center",
        email: "hospital@mediroute.com",
        password: "pass123",
      },
      {
        name: "Apollo Ludhiana",
        email: "hospital2@mediroute.com",
        password: "pass123",
      },
      {
        name: "PGIMER Annex",
        email: "pgimer@mediroute.com",
        password: "pass123",
      },
      {
        name: "Civil Hospital",
        email: "civil@mediroute.com",
        password: "pass123",
      },
      {
        name: "Max Super Speciality",
        email: "max@mediroute.com",
        password: "pass123",
      },
    ],
  },
  {
    role: "admin",
    icon: "🖥",
    label: "Administrator",
    description: "City-wide oversight, analytics, live ambulance map",
    email: "admin@mediroute.com",
    password: "pass123",
    redirect: "/admin",
    gradient: "from-amber-500 to-orange-600",
    hoverGradient: "from-amber-400 to-orange-500",
    shadow: "shadow-amber-500/30",
    ring: "ring-amber-400",
    iconBg: "bg-amber-400/20",
    features: ["Analytics Dashboard", "Hospital Ratings", "Live City Map"],
  },
];

export default function DemoPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState("");
  const [expandedCard, setExpandedCard] = useState(null);

  const handleDemoLogin = async (account) => {
    setLoadingRole(account.role);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.msg || "Login failed. Is the server running and seeded?");
        setLoadingRole(null);
        return;
      }

      login(data.token, data.user);

      // Small delay for visual feedback
      await new Promise((r) => setTimeout(r, 400));

      navigate(account.redirect);
    } catch (err) {
      console.error("Demo login error:", err);
      setError(
        "Cannot connect to server. Make sure it's running on port 5001.",
      );
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden flex flex-col">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Subtle radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
              <svg
                className="w-8 h-8 text-indigo-400"
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
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Med<span className="text-indigo-400">Manage</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium mb-2">
            AI-Powered Emergency Medical Coordination System
          </p>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-sm font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            LIVE DEMO
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-8 max-w-2xl w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <p className="text-red-400 font-semibold text-sm">{error}</p>
            <p className="text-red-400/70 text-xs mt-1">
              Run:{" "}
              <code className="bg-red-500/20 px-1.5 py-0.5 rounded font-mono">
                npm run seed
              </code>{" "}
              then{" "}
              <code className="bg-red-500/20 px-1.5 py-0.5 rounded font-mono">
                npm run dev
              </code>
            </p>
          </div>
        )}

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl w-full">
          {DEMO_ACCOUNTS.map((account) => {
            const isLoading = loadingRole === account.role;
            const isDisabled = loadingRole !== null;
            const isExpanded = expandedCard === account.role;

            return (
              <button
                key={account.role}
                onClick={() => {
                  if (account.hospitals) {
                    setExpandedCard(isExpanded ? null : account.role);
                  } else {
                    handleDemoLogin(account);
                  }
                }}
                disabled={isDisabled && !account.hospitals}
                className={`group relative text-left rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 sm:p-7 transition-all duration-300 overflow-hidden
                  ${isDisabled && !isLoading && !account.hospitals ? "opacity-40 cursor-not-allowed" : ""}
                  ${!isDisabled || account.hospitals ? "hover:bg-white/[0.06] hover:border-white/20 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]" : ""}
                  ${isLoading ? `ring-2 ${account.ring} bg-white/[0.06]` : ""}
                  ${isExpanded ? `ring-2 ${account.ring} bg-white/[0.06] sm:col-span-2` : ""}
                `}
              >
                {/* Gradient glow on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${account.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 rounded-2xl`}
                />

                {/* Top Row: Icon + Role */}
                <div className="relative flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl ${account.iconBg} flex items-center justify-center text-3xl shadow-lg ${account.shadow} group-hover:scale-110 transition-transform duration-300`}
                    >
                      {account.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {account.label}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        {account.email}
                      </p>
                    </div>
                  </div>

                  {/* Arrow / Spinner */}
                  <div className="mt-1">
                    {isLoading ? (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
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
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <svg
                          className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="relative text-sm text-slate-400 mb-4 leading-relaxed">
                  {account.description}
                </p>

                {/* Feature Tags */}
                <div className="relative flex flex-wrap gap-2">
                  {account.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-white/5 px-2.5 py-1 rounded-md border border-white/5"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Hospital sub-options */}
                {account.hospitals && isExpanded && (
                  <div className="relative mt-4 pt-4 border-t border-white/10 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Select Hospital:
                    </p>
                    {account.hospitals.map((h) => (
                      <div
                        key={h.email}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDemoLogin({
                            ...account,
                            email: h.email,
                            password: h.password,
                            label: h.name,
                          });
                        }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-violet-500/20 hover:border-violet-400/40 transition-all cursor-pointer group/hospital"
                      >
                        <div>
                          <span className="text-sm font-bold text-white">
                            {h.name}
                          </span>
                          <span className="block text-[11px] font-mono text-slate-500">
                            {h.email}
                          </span>
                        </div>
                        <svg
                          className="w-4 h-4 text-slate-500 group-hover/hospital:text-violet-400 transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expand hint for hospital card */}
                {account.hospitals && !isExpanded && (
                  <div className="relative mt-3 text-[11px] text-violet-400/70 font-semibold flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
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
                    Click to choose hospital
                  </div>
                )}

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-2xl">
                    <div className="bg-slate-900/90 px-5 py-3 rounded-xl border border-white/10 flex items-center gap-3">
                      <svg
                        className="animate-spin h-5 w-5 text-indigo-400"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="text-white font-bold text-sm">
                        Signing in as {account.label}...
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer links */}
        <div className="mt-10 flex items-center gap-6 text-sm">
          <button
            onClick={() => navigate("/login")}
            className="text-slate-500 hover:text-indigo-400 font-semibold transition-colors flex items-center gap-1.5"
          >
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
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Manual Login
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => navigate("/register")}
            className="text-slate-500 hover:text-indigo-400 font-semibold transition-colors flex items-center gap-1.5"
          >
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Create Account
          </button>
        </div>

        {/* Tech stack badge */}
        <div className="mt-6 text-[11px] text-slate-600 font-mono tracking-wider uppercase">
          React + Node.js + MongoDB + Socket.IO + AI Severity Engine
        </div>
      </div>
    </div>
  );
}
