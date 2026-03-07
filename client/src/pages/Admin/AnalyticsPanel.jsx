import React, { useState, useEffect, useContext } from "react";
import ThemeToggle from "../../components/shared/ThemeToggle";
import AuthContext from "../../context/AuthContext";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

const OUTCOME_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#64748b", "#8b5cf6"];

const AnalyticsPanel = () => {
  const { authHeaders } = useContext(AuthContext);
  const [animateCards, setAnimateCards] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real data from API
  const [analytics, setAnalytics] = useState({
    totalCases: 0,
    totalPatients: 0,
    totalHospitals: 0,
    totalAmbulances: 0,
    activeCases: 0,
    weeklyCases: [],
    weeklyLabels: [],
    responseTimesAvg: [],
    responseTimeLabels: [],
    hourlyCasesData: [],
    topHospitals: [],
    severityDistribution: { high: 0, medium: 0, low: 0 },
    outcomes: {},
    routeAnalysis: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/analytics", {
          headers: authHeaders(),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch analytics: ${res.status}`);
        }

        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Animate cards after mount
    const timer = setTimeout(() => setAnimateCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ── Derived chart data ──

  // Hourly cases for stacked bar chart
  const hourlyCasesData =
    analytics.hourlyCasesData && analytics.hourlyCasesData.length > 0
      ? analytics.hourlyCasesData
      : [];

  // Response time data for line chart
  const responseTimeData = (analytics.responseTimeLabels || []).map(
    (label, i) => ({
      day: label,
      time: (analytics.responseTimesAvg || [])[i] || 0,
    }),
  );

  // Patient outcomes for pie chart
  const outcomesData = Object.entries(analytics.outcomes || {})
    .filter(([key]) => key && key !== "undefined")
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace("_", " "),
      value: value,
    }));

  // If no outcomes data, show severity distribution as a fallback
  const pieData =
    outcomesData.length > 0
      ? outcomesData
      : [
          {
            name: "Critical",
            value: analytics.severityDistribution?.high || 0,
          },
          {
            name: "Urgent",
            value: analytics.severityDistribution?.medium || 0,
          },
          { name: "Stable", value: analytics.severityDistribution?.low || 0 },
        ].filter((d) => d.value > 0);

  // Route analysis table
  const routeAnalysis = analytics.routeAnalysis || [];

  // Weekly cases bar chart
  const weeklyCasesData = (analytics.weeklyLabels || []).map((label, i) => ({
    day: label,
    cases: (analytics.weeklyCases || [])[i] || 0,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 dark:text-gray-400 font-medium">
            Loading analytics data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200">
            Failed to Load Analytics
          </h2>
          <p className="text-slate-500 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-gray-700 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              System Analytics
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">
              Impact metrics and historical performance evaluation
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* SECTION 1 - Key Stats (from real data) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <div
            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-all duration-700 transform ${animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            style={{ transitionDelay: "0ms" }}
          >
            <div className="bg-blue-100 text-blue-600 p-3.5 rounded-xl text-3xl">
              📋
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                Total Cases
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-gray-200">
                {analytics.totalCases}
              </div>
            </div>
          </div>

          <div
            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-all duration-700 transform ${animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="bg-indigo-100 text-indigo-600 p-3.5 rounded-xl text-3xl">
              🏥
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                Hospitals
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-gray-200">
                {analytics.totalHospitals}
              </div>
            </div>
          </div>

          <div
            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-all duration-700 transform ${animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="bg-amber-100 text-amber-600 p-3.5 rounded-xl text-3xl">
              🚑
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                Ambulances
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-gray-200">
                {analytics.totalAmbulances}
              </div>
            </div>
          </div>

          <div
            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-all duration-700 transform ${animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            style={{ transitionDelay: "300ms" }}
          >
            <div className="bg-purple-100 text-purple-600 p-3.5 rounded-xl text-3xl">
              👤
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                Total Patients
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-gray-200">
                {analytics.totalPatients}
              </div>
            </div>
          </div>

          <div
            className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-green-100 p-6 flex items-center gap-4 transition-all duration-700 transform ${animateCards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            style={{ transitionDelay: "400ms" }}
          >
            <div className="bg-green-100 text-green-600 p-3.5 rounded-xl text-3xl">
              ⚡
            </div>
            <div>
              <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-0.5">
                Active Now
              </div>
              <div className="text-3xl font-black text-green-600">
                {analytics.activeCases || 0}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 - CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart A: Hourly Cases or Weekly Cases */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 col-span-1 lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200 mb-6">
              {hourlyCasesData.length > 0
                ? "Cases per Hour (Last 12 Hours)"
                : "Cases per Day (Last 7 Days)"}
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              {hourlyCasesData.length > 0 ? (
                <BarChart
                  data={hourlyCasesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                  <Bar
                    dataKey="critical"
                    name="Critical"
                    stackId="a"
                    fill="#ef4444"
                    radius={[0, 0, 4, 4]}
                  />
                  <Bar
                    dataKey="urgent"
                    name="Urgent"
                    stackId="a"
                    fill="#f59e0b"
                  />
                  <Bar
                    dataKey="stable"
                    name="Stable"
                    stackId="a"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <BarChart
                  data={weeklyCasesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="cases"
                    name="Cases"
                    fill="#6366f1"
                    radius={[4, 4, 4, 4]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
            {hourlyCasesData.length === 0 &&
              weeklyCasesData.every((d) => d.cases === 0) && (
                <div className="text-center py-8 text-slate-400 dark:text-gray-500 font-medium">
                  No case data available yet. Cases will appear here as they are
                  created.
                </div>
              )}
          </div>

          {/* Chart B: Average Response Time */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200 mb-6 flex justify-between items-center">
              Avg Response Time
              <span className="text-xs font-bold text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded">
                Last 7 Days
              </span>
            </h2>
            {responseTimeData.length > 0 &&
            responseTimeData.some((d) => d.time > 0) ? (
              <ResponsiveContainer width="100%" height={256}>
                <LineChart
                  data={responseTimeData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    cursor={{
                      stroke: "#cbd5e1",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => [`${value} min`, "Avg Response"]}
                  />
                  <ReferenceLine
                    y={8}
                    label={{
                      position: "top",
                      value: "Target (8m)",
                      fill: "#ef4444",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="time"
                    name="Time (min)"
                    stroke="#6366f1"
                    strokeWidth={3}
                    activeDot={{
                      r: 6,
                      fill: "#6366f1",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[256px] text-slate-400 dark:text-gray-500 font-medium">
                No response time data available yet.
              </div>
            )}
          </div>

          {/* Chart C: Patient Outcomes / Severity Distribution */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200 mb-6">
              {outcomesData.length > 0
                ? "Patient Outcomes"
                : "Severity Distribution"}
            </h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                  <Pie
                    data={pieData}
                    cx="40%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={OUTCOME_COLORS[index % OUTCOME_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[256px] text-slate-400 dark:text-gray-500 font-medium">
                No outcome data available yet.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3 - Top Hospitals Table */}
        {analytics.topHospitals && analytics.topHospitals.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900">
              <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200">
                Top Hospitals by Cases Handled
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium tracking-wide mt-1">
                Ranked by total cases processed
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800">
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500">
                      Rank
                    </th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500">
                      Hospital
                    </th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500 text-center">
                      Cases Handled
                    </th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {analytics.topHospitals.map((hospital, i) => {
                    const maxCases =
                      analytics.topHospitals[0]?.casesHandled || 1;
                    const sharePercent = Math.round(
                      (hospital.casesHandled /
                        Math.max(analytics.totalCases, 1)) *
                        100,
                    );
                    const barWidth = Math.round(
                      (hospital.casesHandled / maxCases) * 100,
                    );

                    return (
                      <tr
                        key={i}
                        className="border-b border-slate-50 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="py-3 px-6 font-black text-slate-400 dark:text-gray-500 text-lg">
                          #{i + 1}
                        </td>
                        <td className="py-3 px-6 font-bold text-slate-800 dark:text-gray-200">
                          {hospital.name}
                        </td>
                        <td className="py-3 px-6 font-bold text-slate-800 dark:text-gray-200 text-center">
                          {hospital.casesHandled}
                        </td>
                        <td className="py-3 px-6 w-48">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                                style={{ width: `${barWidth}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-gray-400 w-10 text-right">
                              {sharePercent}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4 - Route Analysis Table */}
        {routeAnalysis.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200">
                  Route Analysis Directory
                </h2>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium tracking-wide mt-1">
                  Recently completed ambulance dispatches
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800">
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500">
                      Case ID
                    </th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500">
                      Patient
                    </th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500">
                      Hospital
                    </th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500 text-center">
                      Ambulance
                    </th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500 text-center">
                      Response Time
                    </th>
                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500 text-center">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {routeAnalysis.map((route, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-50 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="py-3 px-6 font-bold text-slate-800 dark:text-gray-200">
                        {route.caseId}
                      </td>
                      <td className="py-3 px-6 font-medium text-slate-600 dark:text-gray-400">
                        {route.patientName}
                      </td>
                      <td className="py-3 px-6 font-bold text-slate-700 dark:text-gray-300">
                        {route.hospital}
                      </td>
                      <td className="py-3 px-6 font-medium text-slate-600 dark:text-gray-400 text-center">
                        {route.ambulanceId}
                      </td>
                      <td className="py-3 px-6 font-bold text-slate-800 dark:text-gray-200 text-center">
                        {route.responseTime}
                      </td>
                      <td className="py-3 px-6 font-medium text-slate-500 dark:text-gray-400 text-center">
                        {route.date
                          ? new Date(route.date).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state when no data at all */}
        {analytics.totalCases === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200 mb-2">
              No Data Yet
            </h2>
            <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto">
              Analytics will populate automatically as cases are created and
              processed through the system. Try requesting an ambulance or
              creating a case to see data appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;
