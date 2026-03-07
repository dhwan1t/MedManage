import React, { useState } from 'react';

const SYMPTOMS_LIST = [
    "Fever", "Cough", "Headache", "Fatigue", "Nausea",
    "Breathlessness", "Chest Pain", "Body Ache", "Sore Throat", "Dizziness"
];

const PRE_EXISTING_CONDITIONS = [
    "Diabetes", "Hypertension", "Asthma", "None"
];

// Re-using mock data from Disease Alerts to show possible matches
const ALERTS_MOCK_DATA = [
    { id: 1, name: "H3N2 Influenza", matchSymptoms: ["Fever", "Cough", "Sore Throat", "Body Ache"] },
    { id: 2, name: "Dengue Fever", matchSymptoms: ["Fever", "Headache", "Body Ache", "Nausea"] },
    { id: 3, name: "Common Cold Outbreak", matchSymptoms: ["Cough", "Sore Throat", "Fatigue", "Fever", "Headache"] }
];

export default function SymptomChecker() {
    const [step, setStep] = useState(1);

    // Step 1 State
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);

    // Step 2 State
    const [duration, setDuration] = useState("");
    const [severity, setSeverity] = useState(0);
    const [conditions, setConditions] = useState([]);

    const toggleSymptom = (symptom) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptom)
                ? prev.filter(s => s !== symptom)
                : [...prev, symptom]
        );
    };

    const toggleCondition = (condition) => {
        if (condition === "None") {
            setConditions(["None"]);
            return;
        }
        setConditions(prev => {
            const newConditions = prev.filter(c => c !== "None"); // Remove 'None' if another is selected
            return newConditions.includes(condition)
                ? newConditions.filter(c => c !== condition)
                : [...newConditions, condition];
        });
    };

    const calculateResult = () => {
        // 1. Emergency Check
        if (selectedSymptoms.includes("Chest Pain") || selectedSymptoms.includes("Breathlessness")) {
            return {
                type: "EMERGENCY",
                title: "Medical Emergency Detected",
                message: "You are exhibiting symptoms that require immediate emergency medical attention.",
                bannerClass: "bg-red-100 border-red-500 text-red-900",
                iconClass: "text-red-600"
            };
        }
        // 2. Doctor Visit Check
        if (severity >= 4) {
            return {
                type: "DOCTOR",
                title: "Consult a Doctor",
                message: "Your symptoms appear severe. We recommend scheduling an appointment with a healthcare professional.",
                bannerClass: "bg-orange-100 border-orange-500 text-orange-900",
                iconClass: "text-orange-600"
            };
        }
        // 3. Home Care Check
        return {
            type: "HOME_CARE",
            title: "Home Care Recommended",
            message: "Your symptoms seem mild. Rest and monitor your condition. Consult a doctor if they worsen.",
            bannerClass: "bg-emerald-100 border-emerald-500 text-emerald-900",
            iconClass: "text-emerald-600",
            tips: [
                "Stay hydrated and drink plenty of warm fluids",
                "Get plenty of rest",
                "Take over-the-counter medication if appropriate",
                "Monitor your temperature regularly"
            ]
        };
    };

    const getMatchedDiseases = () => {
        if (selectedSymptoms.length === 0) return [];

        // Calculate simple match score
        const matches = ALERTS_MOCK_DATA.map(disease => {
            const matchCount = disease.matchSymptoms.filter(s => selectedSymptoms.includes(s)).length;
            return { ...disease, matchCount };
        });

        // Sort by most matches and filter out 0 matches
        return matches.filter(m => m.matchCount > 0).sort((a, b) => b.matchCount - a.matchCount);
    };

    const result = step === 3 ? calculateResult() : null;
    const matchedDiseases = step === 3 ? getMatchedDiseases() : [];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto shadow-sm bg-white rounded-2xl border border-gray-100 overflow-hidden">

                {/* Header & Progress Bar */}
                <div className="bg-indigo-600 px-6 py-8 text-white relative">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Symptom Checker</h1>
                    <p className="text-indigo-100 mb-6">Evaluate your symptoms and get recommended next steps.</p>

                    <div className="relative">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                            <div style={{ width: `${(step / 3) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white transition-all duration-500 ease-in-out"></div>
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-indigo-100">
                            <span className={step >= 1 ? "text-white" : ""}>Step 1: Symptoms</span>
                            <span className={step >= 2 ? "text-white" : ""}>Step 2: Details</span>
                            <span className={step >= 3 ? "text-white" : ""}>Step 3: Results</span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 md:p-8">

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">What symptoms are you experiencing?</h2>
                            <p className="text-gray-500 text-sm">Select all that apply to get the most accurate result.</p>

                            <div className="flex flex-wrap gap-3 mt-4">
                                {SYMPTOMS_LIST.map(symptom => {
                                    const isSelected = selectedSymptoms.includes(symptom);
                                    return (
                                        <button
                                            key={symptom}
                                            onClick={() => toggleSymptom(symptom)}
                                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                                                }`}
                                        >
                                            {symptom}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className="space-y-8 animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Tell us more about your condition</h2>

                            {/* Duration */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700">How long have you had these symptoms?</label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {["Today", "2-3 days", "1 week+"].map(opt => (
                                        <label key={opt} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${duration === opt ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input
                                                type="radio"
                                                name="duration"
                                                value={opt}
                                                checked={duration === opt}
                                                onChange={(e) => setDuration(e.target.value)}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Severity Scale */}
                            <div className="space-y-3 pt-2">
                                <label className="block text-sm font-semibold text-gray-700">How severe are your symptoms? (1 = Mild, 5 = Severe)</label>
                                <div className="flex gap-2 sm:gap-4">
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setSeverity(num)}
                                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${severity === num
                                                    ? 'bg-indigo-600 text-white shadow-lg transform scale-110'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pre-existing conditions */}
                            <div className="space-y-3 pt-2">
                                <label className="block text-sm font-semibold text-gray-700">Any pre-existing conditions?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {PRE_EXISTING_CONDITIONS.map(condition => (
                                        <label key={condition} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${conditions.includes(condition) ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                                            <input
                                                type="checkbox"
                                                checked={conditions.includes(condition)}
                                                onChange={() => toggleCondition(condition)}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">{condition}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* STEP 3 (RESULTS) */}
                    {step === 3 && result && (
                        <div className="space-y-6 animate-fadeIn">

                            {/* Result Banner */}
                            <div className={`p-6 border-l-4 rounded-r-xl ${result.bannerClass}`}>
                                <div className="flex items-start">
                                    <div className={`flex-shrink-0 mt-0.5 ${result.iconClass}`}>
                                        {result.type === 'EMERGENCY' ? (
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        ) : result.type === 'DOCTOR' ? (
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        ) : (
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-xl font-bold">{result.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed font-medium">{result.message}</p>

                                        {result.tips && (
                                            <ul className="mt-4 list-disc list-inside space-y-1 text-sm font-medium">
                                                {result.tips.map((tip, idx) => (
                                                    <li key={idx}>{tip}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Matched Diseases */}
                            {matchedDiseases.length > 0 && (
                                <div className="mt-8">
                                    <h4 className="text-lg font-bold text-gray-800 mb-4">Possible related active alerts in your area:</h4>
                                    <div className="space-y-3">
                                        {matchedDiseases.map(disease => (
                                            <div key={disease.id} className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-indigo-900">{disease.name}</p>
                                                    <p className="text-xs text-indigo-600 font-medium">Matches {disease.matchCount} of your symptoms</p>
                                                </div>
                                                <span className="px-3 py-1 bg-white text-indigo-700 text-xs font-bold rounded-full shadow-sm">
                                                    Info Available
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                                {result.type === 'EMERGENCY' ? (
                                    <a href="/request-ambulance" className="flex-1 bg-red-600 hover:bg-red-700 text-white text-center font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        Request Ambulance
                                    </a>
                                ) : (
                                    <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Find Nearest Clinic
                                    </button>
                                )}

                                {result.type !== 'EMERGENCY' && (
                                    <a href="/request-ambulance" className="flex-1 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 text-center font-bold py-3 px-6 rounded-xl transition-colors flex justify-center items-center gap-2">
                                        Emergency Help
                                    </a>
                                )}
                            </div>

                        </div>
                    )}

                    {/* Navigation Controls */}
                    {step < 3 && (
                        <div className="mt-8 pt-6 border-t flex justify-between">
                            <button
                                onClick={() => setStep(step - 1)}
                                className={`px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors ${step === 1 ? 'invisible' : ''}`}
                            >
                                Back
                            </button>

                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={
                                    (step === 1 && selectedSymptoms.length === 0) ||
                                    (step === 2 && (!duration || severity === 0 || conditions.length === 0))
                                }
                                className="px-8 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:shadow-none"
                            >
                                Next Step
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="mt-6 text-center">
                            <button onClick={() => {
                                setStep(1);
                                setSelectedSymptoms([]);
                                setDuration("");
                                setSeverity(0);
                                setConditions([]);
                            }} className="text-gray-500 font-medium hover:text-indigo-600 underline text-sm transition-colors">
                                Start Over
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}