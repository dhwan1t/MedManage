import React, { useState } from 'react';

const EMERGENCY_TYPES = [
    "",
    "Accident",
    "Heart Attack",
    "Breathing Issue",
    "Unconscious",
    "Other"
];

export default function RequestAmbulance() {
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        location: "",
        emergencyType: "",
        notes: ""
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState("IDLE"); // IDLE, SUCCESS, ERROR
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleUseMyLocation = () => {
        setFormData(prev => ({ ...prev, location: "Sector 12, Ludhiana" }));
        if (errors.location) {
            setErrors(prev => ({ ...prev, location: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
        if (!formData.phone.trim()) newErrors.phone = "Phone Number is required";
        if (!formData.location.trim()) newErrors.location = "Location is required";
        if (!formData.emergencyType) newErrors.emergencyType = "Emergency Type is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus("IDLE");

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // we use fetch as a safe default if axios might not be installed
            const response = await fetch('/api/public/request-ambulance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            // Even if API fails, we want to mock success as requested if API not ready
            // We will wait 1.5s to simulate the request anyway
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Simulating success
            setSubmitStatus("SUCCESS");

        } catch (err) {
            // If fetch fails (network error, etc)
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSubmitStatus("ERROR");
            setErrorMessage("Failed to connect. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setSubmitStatus("IDLE");
        setFormData({
            fullName: "",
            phone: "",
            location: "",
            emergencyType: "",
            notes: ""
        });
    };

    // Success Screen
    if (submitStatus === "SUCCESS") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-lg p-8 text-center border border-gray-100 animate-fadeIn">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <svg className="w-10 h-10 text-green-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Ambulance Dispatched!</h2>
                    <p className="text-gray-500 font-medium mb-8">Help is on the way to your location.</p>

                    <div className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-100 text-left space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                            <span className="text-gray-500 font-semibold text-sm">Estimated Time</span>
                            <span className="text-xl font-bold text-indigo-700">~8 minutes</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-gray-500 font-semibold text-sm">Ambulance ID</span>
                            <span className="text-gray-900 font-bold bg-gray-200 px-3 py-1 rounded-md tracking-wider">AMB-2047</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCancel}
                        className="w-full py-3 px-4 bg-white border-2 border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all"
                    >
                        Cancel Request
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Header */}
                <div className="bg-red-600 px-6 py-8 text-white text-center">
                    <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Request Ambulance</h1>
                    <p className="mt-2 text-red-100 font-medium">In case of extreme emergency, please call your local emergency number directly.</p>
                </div>

                {/* Form Content */}
                <div className="p-6 md:p-8 relative">

                    {/* Error Toast */}
                    {submitStatus === "ERROR" && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-start animate-fadeIn">
                            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-red-800 font-medium">{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-gray-700">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow disabled:bg-gray-100 ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="John Doe"
                                />
                                {errors.fullName && <p className="text-red-500 text-xs font-semibold mt-1">{errors.fullName}</p>}
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow disabled:bg-gray-100 ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="+91 98765 43210"
                                />
                                {errors.phone && <p className="text-red-500 text-xs font-semibold mt-1">{errors.phone}</p>}
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-end mb-1 text-sm">
                                <label className="font-bold text-gray-700">Location <span className="text-red-500">*</span></label>
                                <button
                                    type="button"
                                    onClick={handleUseMyLocation}
                                    disabled={isSubmitting}
                                    className="text-red-600 font-bold hover:text-red-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Use My Location
                                </button>
                            </div>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow disabled:bg-gray-100 ${errors.location ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                placeholder="Enter exact address or landmark"
                            />
                            {errors.location && <p className="text-red-500 text-xs font-semibold mt-1">{errors.location}</p>}
                        </div>

                        {/* Emergency Type */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-gray-700">Type of Emergency <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    name="emergencyType"
                                    value={formData.emergencyType}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={`w-full p-3 border rounded-xl appearance-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow disabled:bg-gray-100 bg-white ${errors.emergencyType ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                >
                                    <option value="" disabled>Select emergency type</option>
                                    {EMERGENCY_TYPES.filter(t => t !== "").map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            {errors.emergencyType && <p className="text-red-500 text-xs font-semibold mt-1">{errors.emergencyType}</p>}
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-gray-700">Additional Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow disabled:bg-gray-100 resize-none"
                                placeholder="Any specific landmarks, patient condition details, etc."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing Request...
                                    </>
                                ) : (
                                    "REQUEST AMBULANCE NOW"
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}