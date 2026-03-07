import React, { useState, useEffect } from 'react';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { io } from 'socket.io-client';

const HospitalDashboard = () => {
    const [status, setStatus] = useState('ACCEPTING');
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

    const [stats, setStats] = useState({
        general: { available: 12, total: 48, label: 'General Beds' },
        icu: { available: 3, total: 10, label: 'ICU Beds' },
        ot: { available: 2, total: 4, label: 'OT Theatres' },
        er: { available: 5, total: 8, label: 'ER Bays' }
    });

    const [incomingPatients, setIncomingPatients] = useState([]);

    useEffect(() => {
        // Connect to Socket.IO server
        const socket = io('http://localhost:5000');

        socket.on('ambulance:dispatch', (data) => {
            setIncomingPatients(prev => {
                const newList = [...prev, data];
                // Sort by highest severity score first
                return newList.sort((a, b) => b.severityScore - a.severityScore);
            });
            setLastUpdated(new Date().toLocaleTimeString());
        });

        socket.on('patient:vitals_update', (data) => {
            setIncomingPatients(prev => {
                const updated = prev.map(p => p.patientId === data.patientId ? { ...p, ...data } : p);
                // Resort after update
                return updated.sort((a, b) => b.severityScore - a.severityScore);
            });
            setLastUpdated(new Date().toLocaleTimeString());
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const toggleStatus = () => {
        const statuses = ['ACCEPTING', 'AT CAPACITY', 'EMERGENCY ONLY'];
        const nextIdx = (statuses.indexOf(status) + 1) % statuses.length;
        setStatus(statuses[nextIdx]);
        setLastUpdated(new Date().toLocaleTimeString());
    };

    const getStatusBadgeColors = () => {
        if (status === 'ACCEPTING') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'AT CAPACITY') return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-orange-100 text-orange-800 border-orange-200'; // EMERGENCY ONLY
    };

    const renderStatCard = (key) => {
        const stat = stats[key];
        const occupancy = ((stat.total - stat.available) / stat.total) * 100;

        // green < 70%, yellow 70-90%, red > 90%
        let progressColor = 'bg-red-500';
        if (occupancy < 70) progressColor = 'bg-green-500';
        else if (occupancy <= 90) progressColor = 'bg-yellow-500';

        return (
            <div key={key} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-gray-800 p-5 flex flex-col hover:shadow-md transition-shadow">
                <h3 className="text-slate-500 dark:text-gray-400 font-medium text-sm mb-2 uppercase tracking-wide">{stat.label}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-extrabold text-slate-800 dark:text-gray-200">{stat.available}</span>
                    <span className="text-slate-400 dark:text-gray-500 text-sm font-medium">/ {stat.total} avail</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2.5 mt-auto overflow-hidden">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${occupancy}%` }}
                    ></div>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-gray-400 text-right">{Math.round(occupancy)}% Used</div>
            </div>
        );
    };

    const getSeverityBadge = (severity) => {
        if (severity === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-200';
        if (severity === 'URGENT') return 'bg-orange-100 text-orange-800 border-orange-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:justify-between md:items-center bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">City Medical Center</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                            Last Updated: {lastUpdated}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={toggleStatus}
                            className={`px-5 py-2.5 rounded-full font-bold text-sm border transition-all hover:scale-105 active:scale-95 shadow-sm ${getStatusBadgeColors()}`}
                        >
                            {status}
                        </button>
                    </div>
                </header>

                {/* Stats Row */}
                <section>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.keys(stats).map(renderStatCard)}
                    </div>
                </section>

                {/* Incoming Patients Panel */}
                <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="relative flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                            </span>
                            Actively Incoming Ambulances
                            <span className="bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 text-sm font-bold px-2.5 py-0.5 rounded-md ml-2">
                                {incomingPatients.length}
                            </span>
                        </h2>
                    </div>

                    {incomingPatients.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                            <div className="text-4xl mb-3">🚑</div>
                            <p className="text-slate-500 dark:text-gray-400 font-medium">No incoming ambulances at this time.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {incomingPatients.map((patient, index) => {
                                const isHighestPriority = index === 0 && incomingPatients.length > 1;

                                return (
                                    <div
                                        key={patient.patientId || index}
                                        className={`flex flex-col md:flex-row bg-white dark:bg-gray-900 border ${isHighestPriority ? 'border-red-300 shadow-md ring-1 ring-red-100' : 'border-slate-200 dark:border-gray-700'} rounded-xl p-5 gap-4 items-start md:items-center relative overflow-hidden`}
                                    >
                                        {isHighestPriority && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                                        )}

                                        <div className={`flex-1 ${isHighestPriority ? 'pl-2' : ''}`}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-bold text-lg text-slate-800 dark:text-gray-200">{patient.patientId}</span>
                                                <span className={`px-2.5 py-1 rounded border text-xs tracking-wide font-bold uppercase ${getSeverityBadge(patient.severity)}`}>
                                                    {patient.severity}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-600 dark:text-gray-400 flex flex-wrap items-center gap-x-6 gap-y-2">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 dark:text-gray-500 text-xs uppercase mb-0.5">ETA</span>
                                                    <span className="text-slate-800 dark:text-gray-200">{patient.eta}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 dark:text-gray-500 text-xs uppercase mb-0.5">Req. Resources</span>
                                                    <span className="text-slate-800 dark:text-gray-200">{patient.resources?.join(', ') || 'None'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isHighestPriority && (
                                            <div className="bg-red-50 px-4 py-3 rounded-lg border border-red-100 text-sm text-red-800 font-bold flex items-center gap-2 shrink-0">
                                                <span>⚠️</span>
                                                <span>Highest Priority</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
};

export default HospitalDashboard;