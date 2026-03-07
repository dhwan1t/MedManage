import React, { useState, useEffect } from "react";
import ThemeToggle from "../../components/shared/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const mockCityData = {
  Ludhiana: {
    stats: {
      ambulances: 12,
      hospitalsOnline: 8,
      casesToday: 47,
      livesImpacted: 47,
      avgResponse: 6.2,
    },
    hospitals: [
      {
        id: "h1",
        name: "City Medical Center",
        beds: 12,
        icu: 3,
        ot: 2,
        er: 5,
        status: "ACCEPTING",
        rating: 4.8,
      },
      {
        id: "h2",
        name: "Fortis Escorts",
        beds: 0,
        icu: 0,
        ot: 0,
        er: 0,
        status: "AT CAPACITY",
        rating: 4.5,
      },
      {
        id: "h3",
        name: "DMC Hospital",
        beds: 4,
        icu: 1,
        ot: 0,
        er: 2,
        status: "EMERGENCY ONLY",
        rating: 4.9,
      },
      {
        id: "h4",
        name: "Civil Hospital",
        beds: 24,
        icu: 5,
        ot: 2,
        er: 8,
        status: "ACCEPTING",
        rating: 3.8,
      },
    ],
    feed: [
      {
        id: 1,
        text: "AMB-2047 dispatched to City Medical Center",
        time: "2 min ago",
        type: "urgent",
      },
      {
        id: 2,
        text: "Patient PT-9921 severity: CRITICAL",
        time: "3 min ago",
        type: "critical",
      },
      {
        id: 3,
        text: "OT reserved at DMC Hospital",
        time: "4 min ago",
        type: "stable",
      },
      {
        id: 4,
        text: "AMB-1022 arrived at scene",
        time: "8 min ago",
        type: "stable",
      },
    ],
  },
  Chandigarh: {
    stats: {
      ambulances: 18,
      hospitalsOnline: 12,
      casesToday: 82,
      livesImpacted: 81,
      avgResponse: 5.4,
    },
    hospitals: [
      {
        id: "h5",
        name: "PGIMER",
        beds: 2,
        icu: 0,
        ot: 1,
        er: 1,
        status: "EMERGENCY ONLY",
        rating: 4.9,
      },
      {
        id: "h6",
        name: "Max Super Speciality",
        beds: 15,
        icu: 4,
        ot: 3,
        er: 4,
        status: "ACCEPTING",
        rating: 4.7,
      },
      {
        id: "h7",
        name: "GMSH Sector 16",
        beds: 30,
        icu: 8,
        ot: 4,
        er: 12,
        status: "ACCEPTING",
        rating: 4.1,
      },
    ],
    feed: [
      {
        id: 5,
        text: "Mass casualty protocol activated",
        time: "1 min ago",
        type: "critical",
      },
      {
        id: 6,
        text: "AMB-3011 dispatched to Sector 17",
        time: "5 min ago",
        type: "urgent",
      },
    ],
  },
  Amritsar: {
    stats: {
      ambulances: 8,
      hospitalsOnline: 5,
      casesToday: 21,
      livesImpacted: 21,
      avgResponse: 7.1,
    },
    hospitals: [
      {
        id: "h8",
        name: "Amandeep Hospital",
        beds: 18,
        icu: 5,
        ot: 2,
        er: 6,
        status: "ACCEPTING",
        rating: 4.6,
      },
      {
        id: "h9",
        name: "Guru Nanak Dev",
        beds: 5,
        icu: 1,
        ot: 1,
        er: 2,
        status: "ACCEPTING",
        rating: 4.2,
      },
    ],
    feed: [
      {
        id: 7,
        text: "Patient PT-8812 stabilized",
        time: "10 min ago",
        type: "stable",
      },
    ],
  },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState("Ludhiana");
  const [data, setData] = useState(mockCityData["Ludhiana"]);
  const [feed, setFeed] = useState(mockCityData["Ludhiana"].feed);

  useEffect(() => {
    // Setup generic socket connection to intercept global feed
    const socket = io("http://localhost:5001");

    socket.on("admin:status_update", (event) => {
      if (event.city === selectedCity || !event.city) {
        setFeed((prev) =>
          [
            {
              id: Date.now(),
              text: event.message,
              time: "Just now",
              type: event.severity || "stable",
            },
            ...prev,
          ].slice(0, 10),
        ); // Keep last 10
      }
    });

    return () => socket.disconnect();
  }, [selectedCity]);

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setData(mockCityData[city]);
    setFeed(mockCityData[city].feed);
  };

  const getStatusBadge = (status) => {
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
              <select
                id="city-select"
                value={selectedCity}
                onChange={handleCityChange}
                className="px-4 py-2 border-2 border-slate-200 dark:border-gray-700 rounded-lg text-slate-800 dark:text-gray-200 font-bold outline-none focus:border-indigo-500 bg-white dark:bg-gray-900 shadow-sm"
              >
                <option value="Ludhiana">Ludhiana</option>
                <option value="Chandigarh">Chandigarh</option>
                <option value="Amritsar">Amritsar</option>
              </select>
            </div>
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
              Lives Impacted
            </div>
            <div className="text-3xl font-black text-green-600">
              {data.stats.livesImpacted}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-800 p-5">
            <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">
              Avg Response
            </div>
            <div className="text-3xl font-black text-indigo-600">
              {data.stats.avgResponse}{" "}
              <span className="text-lg font-medium tracking-normal text-slate-400 dark:text-gray-500">
                min
              </span>
            </div>
          </div>
        </div>

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
