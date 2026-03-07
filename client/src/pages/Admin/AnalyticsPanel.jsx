import React, { useState, useEffect } from 'react';
import ThemeToggle from '../../components/shared/ThemeToggle';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis,
    Tooltip, Legend, Cell, ResponsiveContainer, ReferenceLine, CartesianGrid
} from 'recharts';

// --- MOCK DATA ---

const hourlyCasesData = [
    { hour: '04:00', stable: 2, urgent: 1, critical: 0 },
    { hour: '05:00', stable: 1, urgent: 2, critical: 1 },
    { hour: '06:00', stable: 3, urgent: 1, critical: 0 },
    { hour: '07:00', stable: 5, urgent: 3, critical: 1 },
    { hour: '08:00', stable: 8, urgent: 5, critical: 2 },
    { hour: '09:00', stable: 12, urgent: 4, critical: 3 },
    { hour: '10:00', stable: 10, urgent: 6, critical: 2 },
    { hour: '11:00', stable: 7, urgent: 4, critical: 1 },
    { hour: '12:00', stable: 9, urgent: 5, critical: 2 },
    { hour: '13:00', stable: 11, urgent: 3, critical: 0 },
    { hour: '14:00', stable: 8, urgent: 7, critical: 4 },
    { hour: '15:00', stable: 6, urgent: 2, critical: 1 },
];

const responseTimeData = [
    { day: 'Mon', time: 7.2 },
    { day: 'Tue', time: 6.8 },
    { day: 'Wed', time: 8.5 },
    { day: 'Thu', time: 6.1 },
    { day: 'Fri', time: 7.5 },
    { day: 'Sat', time: 9.2 },
    { day: 'Sun', time: 6.4 },
];

const outcomesData = [
    { name: 'Stable Discharge', value: 45 },
    { name: 'ICU Admitted', value: 25 },
    { name: 'OT Required', value: 15 },
    { name: 'Other/Transferred', value: 15 },
];
const OUTCOME_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#64748b'];

const routeAnalysisData = [
    { id: 'PT-9942', from: 'Sector 17', hospital: 'PGIMER', distance: '4.2 km', time: '8m', override: true },
    { id: 'PT-9943', from: 'Industrial Area', hospital: 'City Med Center', distance: '2.1 km', time: '5m', override: false },
    { id: 'PT-9944', from: 'Highway 44 Crash', hospital: 'Fortis Escorts', distance: '8.5 km', time: '14m', override: true },
    { id: 'PT-9945', from: 'Model Town', hospital: 'DMC Hospital', distance: '3.6 km', time: '7m', override: false },
    { id: 'PT-9946', from: 'Railway Station', hospital: 'Civil Hospital', distance: '1.8 km', time: '4m', override: false },
    { id: 'PT-9947', from: 'Sector 22', hospital: 'PGIMER', distance: '5.0 km', time: '11m', override: true },
];

// --- COMPONENT ---

const AnalyticsPanel = () => {
    const [animateCards, setAnimateCards] = useState(false);

    useEffect(() => {
        // Mount animation trigger
        const timer = setTimeout(() => setAnimateCards(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Setup */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-gray-700 pb-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">System Analytics</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">Impact metrics and historical performance evaluation</p>
                    </div>
                    <ThemeToggle />
                </header>

                {/* SECTION 1 - Key Impact Numbers (Hero Stats) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                    <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-all duration-700 transform ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '0ms' }}>
                        <div className="bg-blue-100 text-blue-600 p-3.5 rounded-xl text-3xl">⏱️</div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Time Saved Today</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-gray-200">47 <span className="text-lg font-bold text-slate-400 dark:text-gray-500">min</span></div>
                        </div>
                    </div>

                    <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-all duration-700 transform ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '100ms' }}>
                        <div className="bg-indigo-100 text-indigo-600 p-3.5 rounded-xl text-3xl">🗺️</div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Optimal Routes</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-gray-200">23</div>
                        </div>
                    </div>

                    <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-all duration-700 transform ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '200ms' }}>
                        <div className="bg-amber-100 text-amber-600 p-3.5 rounded-xl text-3xl">⚡</div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Queue Interventions</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-gray-200">8 <span className="text-sm font-bold text-slate-400 dark:text-gray-500 ml-1">overrides</span></div>
                        </div>
                    </div>

                    <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-green-100 p-6 flex items-center gap-4 transition-all duration-700 transform ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
                        <div className="bg-green-100 text-green-600 p-3.5 rounded-xl text-3xl">❤️</div>
                        <div>
                            <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-0.5">Est. Lives Saved</div>
                            <div className="text-3xl font-black text-green-600">3</div>
                        </div>
                    </div>

                </div>

                {/* SECTION 2 - CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Chart A: Cases per Hour */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 col-span-1 lg:col-span-2">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200 mb-6">Cases per Hour (Last 12 Hours)</h2>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={hourlyCasesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="urgent" name="Urgent" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="stable" name="Stable" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Chart B: Average Response Time */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200 mb-6 flex justify-between items-center">
                            Avg Response Time
                            <span className="text-xs font-bold text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded">Last 7 Days</span>
                        </h2>
                        <ResponsiveContainer width="100%" height={256}>
                            <LineChart data={responseTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 12]} />
                                <Tooltip
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <ReferenceLine y={8} label={{ position: 'top', value: 'Target (8m)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} stroke="#ef4444" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="time" name="Time (min)" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Chart C: Case Outcomes */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200 mb-6">Patient Outcomes Breakdown</h2>
                        <ResponsiveContainer width="100%" height={256}>
                            <PieChart>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                                <Pie
                                    data={outcomesData}
                                    cx="40%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {outcomesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={OUTCOME_COLORS[index % OUTCOME_COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                {/* SECTION 3 - Route Analysis Table */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-gray-200">Route Analysis Directory</h2>
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium tracking-wide mt-1">Today's completed ambulance dispatches</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800">
                                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500">Case ID</th>
                                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500">Dispatch From</th>
                                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500">Hospital Selected</th>
                                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500 text-center">Distance</th>
                                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500 text-center">Time</th>
                                    <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-slate-400 dark:text-gray-500 text-center">AI Override</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {routeAnalysisData.map((route, i) => (
                                    <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50 dark:bg-gray-900 transition-colors ${route.override ? 'bg-indigo-50/30' : ''}`}>
                                        <td className="py-3 px-6 font-bold text-slate-800 dark:text-gray-200">{route.id}</td>
                                        <td className="py-3 px-6 font-medium text-slate-600 dark:text-gray-400">{route.from}</td>
                                        <td className="py-3 px-6 font-bold text-slate-700 dark:text-gray-300">{route.hospital}</td>
                                        <td className="py-3 px-6 font-medium text-slate-600 dark:text-gray-400 text-center">{route.distance}</td>
                                        <td className="py-3 px-6 font-bold text-slate-800 dark:text-gray-200 text-center">{route.time}</td>
                                        <td className="py-3 px-6 text-center">
                                            {route.override ? (
                                                <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider gap-1">
                                                    <span className="text-indigo-400">⚡</span> Yes
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 dark:text-gray-500 font-medium">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsPanel;