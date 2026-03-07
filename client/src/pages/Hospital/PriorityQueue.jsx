import React, { useState, useEffect, useRef } from 'react';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { io } from 'socket.io-client';

// Initial mock data simulating the dynamic queue
const MOCK_QUEUE = [
    {
        patientId: 'PT-9921',
        age: 54,
        gender: 'M',
        chiefComplaint: 'Chest Pain',
        eta: '6m',
        severity: { score: 82, level: 'CRITICAL', canWait: false, flags: ['shock_risk', 'arrhythmia'] },
        vitals: { heartRate: 118, systolic: 88, diastolic: 60, oxygenSat: 91, temperature: 38.4 },
        requiredResources: ['ICU', 'Cardiologist'],
        timestamp: Date.now() - 100000
    },
    {
        patientId: 'PT-8842',
        age: 28,
        gender: 'F',
        chiefComplaint: 'Fractured Arm',
        eta: 'Arrived',
        severity: { score: 45, level: 'URGENT', canWait: true, flags: ['pain_management'] },
        vitals: { heartRate: 95, systolic: 125, diastolic: 80, oxygenSat: 98, temperature: 37.1 },
        requiredResources: ['X-Ray', 'Ortho'],
        timestamp: Date.now() - 300000
    },
    {
        patientId: 'PT-7711',
        age: 71,
        gender: 'M',
        chiefComplaint: 'Shortness of breath',
        eta: '12m',
        severity: { score: 68, level: 'URGENT', canWait: false, flags: ['respiratory_distress'] },
        vitals: { heartRate: 105, systolic: 150, diastolic: 95, oxygenSat: 93, temperature: 37.8 },
        requiredResources: ['O2', 'Ventilator Backup'],
        timestamp: Date.now() - 50000
    }
];

const PriorityQueue = () => {
    const [queue, setQueue] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [highlightedRow, setHighlightedRow] = useState(null);

    // Audio ref for alert sound on high priority new arrival
    const alertAudioRef = useRef(null);

    useEffect(() => {
        // Initial sort
        const sorted = [...MOCK_QUEUE].sort((a, b) => b.severity.score - a.severity.score);
        setQueue(sorted);
        if (sorted.length > 0) setSelectedPatient(sorted[0]);

        // Setup Socket Connection
        const socket = io('http://localhost:5000');

        socket.on('ambulance:dispatch', (newPatient) => {
            setQueue(prev => {
                const updated = [...prev, newPatient];
                const resorted = updated.sort((a, b) => b.severity.score - a.severity.score);

                // Find new position for animation
                const newPos = resorted.findIndex(p => p.patientId === newPatient.patientId);

                // Trigger highlight animation
                setHighlightedRow(newPatient.patientId);
                setTimeout(() => setHighlightedRow(null), 3000);

                // Play sound if inserted at top 2 positions (high priority interrupt)
                if (newPos <= 1 && alertAudioRef.current) {
                    alertAudioRef.current.play().catch(e => console.log('Audio auto-play blocked:', e));
                }

                return resorted;
            });
        });

        socket.on('patient:vitals_update', (update) => {
            setQueue(prev => {
                let positionChanged = false;
                const oldIndex = prev.findIndex(p => p.patientId === update.patientId);

                const updated = prev.map(p => {
                    if (p.patientId === update.patientId) {
                        // Update severity logic
                        return {
                            ...p,
                            vitals: { ...p.vitals, ...update.vitals },
                            severity: { ...p.severity, ...update.severity }
                        };
                    }
                    return p;
                });

                const resorted = updated.sort((a, b) => b.severity.score - a.severity.score);
                const newIndex = resorted.findIndex(p => p.patientId === update.patientId);

                // Animate if position moved Up (lower index)
                if (oldIndex !== -1 && newIndex < oldIndex) {
                    setHighlightedRow(update.patientId);
                    setTimeout(() => setHighlightedRow(null), 3000);
                    if (newIndex <= 1 && alertAudioRef.current) {
                        alertAudioRef.current.play().catch(e => console.log('Audio auto-play blocked:', e));
                    }
                }

                // If the selected patient was updated, refresh details
                if (selectedPatient && selectedPatient.patientId === update.patientId) {
                    setSelectedPatient(resorted[newIndex]);
                }

                return resorted;
            });
        });

        return () => socket.disconnect();
    }, [selectedPatient]);

    // Demo tool: Inject artificial critical patient
    const triggerDemoInterrupt = () => {
        const demoPatient = {
            patientId: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
            age: 62, gender: 'M',
            chiefComplaint: 'Massive Trauma / Hemorrhage',
            eta: '4m',
            severity: { score: 95, level: 'CRITICAL', canWait: false, flags: ['massive_bleeding', 'shock'] },
            vitals: { heartRate: 140, systolic: 70, diastolic: 40, oxygenSat: 88, temperature: 36.1 },
            requiredResources: ['OT', 'O- Blood', 'Trauma Surgeon'],
            timestamp: Date.now()
        };

        // Dispatch via window object as if socket received it (for demonstration)
        const socketMockEvent = new CustomEvent('socket_mock_dispatch', { detail: demoPatient });
        window.dispatchEvent(socketMockEvent);

        // Direct state update for standalone demo without real socket server
        setQueue(prev => {
            const updated = [...prev, demoPatient];
            const resorted = updated.sort((a, b) => b.severity.score - a.severity.score);
            setHighlightedRow(demoPatient.patientId);
            setTimeout(() => setHighlightedRow(null), 3000);
            return resorted;
        });
    };

    const getSeverityBadgeClass = (score) => {
        if (score >= 80) return 'bg-red-500 text-white';
        if (score >= 60) return 'bg-orange-500 text-white';
        if (score >= 40) return 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-sm';
        return 'bg-green-500 text-white';
    };

    const handleAllocate = async (type, pid) => {
        // In a real app, this integrates with the same endpoint as IncomingPatientAlert
        alert(`Initiating allocation of ${type} for patient ${pid}`);
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">

            {/* Hidden audio element for critical alert pings */}
            <audio ref={alertAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto"></audio>

            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:justify-between items-start md:items-end gap-4 border-b border-slate-200 dark:border-gray-700 pb-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Patient Priority Queue</h1>
                        <p className="text-lg font-medium text-indigo-600 mt-1 uppercase tracking-wide">
                            Sorted by medical urgency — not arrival time
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={triggerDemoInterrupt}
                            className="text-xs bg-slate-800 dark:text-gray-200 text-white px-3 py-1.5 rounded uppercase tracking-widest font-bold hover:bg-slate-700 dark:text-gray-300 transition"
                        >
                            Test Critical Arrival
                        </button>
                    </div>
                </header>

                {/* AI Banner */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start sm:items-center gap-4 shadow-sm">
                    <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600 text-xl hidden sm:block">🧠</div>
                    <p className="text-indigo-900 text-sm font-medium leading-relaxed">
                        <strong className="font-bold">AI Triage Active:</strong> This queue is managed by real-time AI scoring (MEWS + Shock Index + GCS).
                        A patient who arrives later but is more critical will automatically jump to the top and be treated first.
                    </p>
                </div>

                {/* Main 2-Column Layout */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-[calc(100vh-280px)] min-h-[600px]">

                    {/* LEFT: Queue List */}
                    <div className="w-full lg:w-3/5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden flex flex-col">
                        <div className="bg-slate-50 dark:bg-gray-900 px-6 py-4 border-b border-slate-100 dark:border-gray-800 grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-2 text-center">Score</div>
                            <div className="col-span-5">Patient & Complaint</div>
                            <div className="col-span-2 text-center">ETA</div>
                            <div className="col-span-2 text-center">Wait?</div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-2 space-y-2 bg-slate-50 dark:bg-gray-900/50">
                            {queue.map((patient, index) => {
                                const isSelected = selectedPatient?.patientId === patient.patientId;
                                const isHighlighted = highlightedRow === patient.patientId;

                                return (
                                    <div
                                        key={patient.patientId}
                                        onClick={() => setSelectedPatient(patient)}
                                        className={`
                      grid grid-cols-12 gap-4 items-center p-3 rounded-xl cursor-pointer transition-all duration-500
                      ${isSelected ? 'bg-white dark:bg-gray-900 shadow-md ring-2 ring-indigo-500' : 'bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 hover:border-indigo-300 hover:shadow-sm'}
                      ${isHighlighted ? 'bg-yellow-100 border-yellow-400 scale-[1.02] shadow-lg ring-4 ring-yellow-400/50 z-10 relative' : ''}
                    `}
                                    >
                                        <div className="col-span-1 text-center font-black text-slate-400 dark:text-gray-500">
                                            {index + 1}
                                        </div>

                                        <div className="col-span-2 flex justify-center">
                                            <div className={`w-12 h-12 flex items-center justify-center rounded-full font-black text-lg border-2 border-white shadow-sm transition-colors duration-700 ${getSeverityBadgeClass(patient.severity.score)}`}>
                                                {patient.severity.score}
                                            </div>
                                        </div>

                                        <div className="col-span-5">
                                            <div className="font-bold text-slate-800 dark:text-gray-200 flex items-center gap-2">
                                                {patient.patientId}
                                                <span className="text-xs font-medium text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                                    {patient.age}{patient.gender}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-gray-400 font-medium truncate mt-0.5">
                                                {patient.chiefComplaint}
                                            </div>
                                        </div>

                                        <div className="col-span-2 text-center">
                                            <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${patient.eta === 'Arrived' ? 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400' : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                }`}>
                                                {patient.eta}
                                            </span>
                                        </div>

                                        <div className="col-span-2 flex justify-center items-center">
                                            {patient.severity.canWait ? (
                                                <div className="bg-green-100 text-green-700 p-1.5 rounded-full" title="Can wait safely">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                            ) : (
                                                <div className="bg-red-100 text-red-700 p-1.5 rounded-full" title="Cannot wait">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: Detail Panel */}
                    <div className="w-full lg:w-2/5 flex flex-col">
                        {selectedPatient ? (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 p-6 flex-1 flex flex-col h-full overflow-y-auto">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-gray-200">{selectedPatient.patientId}</h2>
                                        <p className="text-slate-500 dark:text-gray-400 font-medium">{selectedPatient.age} yo {selectedPatient.gender === 'M' ? 'Male' : 'Female'} • ETA: {selectedPatient.eta}</p>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-lg font-bold text-sm uppercase tracking-wider ${getSeverityBadgeClass(selectedPatient.severity.score)}`}>
                                        {selectedPatient.severity.level}
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1">

                                    {/* Warning Flags */}
                                    {selectedPatient.severity.flags.length > 0 && (
                                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                            <h3 className="text-xs font-bold text-red-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <span>⚠️</span> Clinical Alerts
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedPatient.severity.flags.map(flag => (
                                                    <span key={flag} className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded shadow-sm border border-red-200">
                                                        {flag.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Complaint & Vitals Grid */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Chief Complaint</h3>
                                        <p className="text-lg font-bold text-slate-800 dark:text-gray-200 mb-5">{selectedPatient.chiefComplaint}</p>

                                        <h3 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3">Live Vitals</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="border border-slate-100 dark:border-gray-800 rounded-xl p-3 bg-slate-50 dark:bg-gray-900/50">
                                                <div className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">HR</div>
                                                <div className={`text-xl font-black ${selectedPatient.vitals.heartRate > 100 || selectedPatient.vitals.heartRate < 60 ? 'text-red-500' : 'text-slate-800 dark:text-gray-200'}`}>
                                                    {selectedPatient.vitals.heartRate} <span className="text-xs font-medium text-slate-400 dark:text-gray-500">bpm</span>
                                                </div>
                                            </div>
                                            <div className="border border-slate-100 dark:border-gray-800 rounded-xl p-3 bg-slate-50 dark:bg-gray-900/50">
                                                <div className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">BP</div>
                                                <div className={`text-xl font-black ${(selectedPatient.vitals.systolic < 90 || selectedPatient.vitals.systolic > 160) ? 'text-red-500' : 'text-slate-800 dark:text-gray-200'}`}>
                                                    {selectedPatient.vitals.systolic}/{selectedPatient.vitals.diastolic}
                                                </div>
                                            </div>
                                            <div className="border border-slate-100 dark:border-gray-800 rounded-xl p-3 bg-slate-50 dark:bg-gray-900/50">
                                                <div className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">SpO2</div>
                                                <div className={`text-xl font-black ${selectedPatient.vitals.oxygenSat < 94 ? 'text-red-500' : 'text-slate-800 dark:text-gray-200'}`}>
                                                    {selectedPatient.vitals.oxygenSat}<span className="text-xs font-medium text-slate-400 dark:text-gray-500">%</span>
                                                </div>
                                            </div>
                                            <div className="border border-slate-100 dark:border-gray-800 rounded-xl p-3 bg-slate-50 dark:bg-gray-900/50">
                                                <div className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase mb-1">Temp</div>
                                                <div className={`text-xl font-black ${(selectedPatient.vitals.temperature > 38 || selectedPatient.vitals.temperature < 36) ? 'text-red-500' : 'text-slate-800 dark:text-gray-200'}`}>
                                                    {selectedPatient.vitals.temperature}<span className="text-xs font-medium text-slate-400 dark:text-gray-500">°C</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requirements */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3">Required Resources</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedPatient.requiredResources.map(res => (
                                                <span key={res} className="bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 text-xs font-bold px-3 py-1.5 rounded border border-slate-200 dark:border-gray-700">
                                                    {res}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                                {/* Assignment Actions */}
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-gray-800 grid grid-cols-2 gap-3 shrink-0">
                                    <button
                                        onClick={() => handleAllocate('ICU', selectedPatient.patientId)}
                                        className="w-full bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:border-indigo-400 hover:text-indigo-700 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span>🛏️</span> Assign ICU
                                    </button>
                                    <button
                                        onClick={() => handleAllocate('OT', selectedPatient.patientId)}
                                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span>🔪</span> Assign OT
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-100 dark:bg-gray-800 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 p-8 text-center h-full">
                                <span className="text-6xl mb-4">🏥</span>
                                <p className="text-lg font-bold">No patient selected</p>
                                <p className="text-sm font-medium mt-1">Click a row in the queue to view clinical details and allocate resources.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PriorityQueue;