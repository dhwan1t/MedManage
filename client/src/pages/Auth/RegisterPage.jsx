import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const ROLES = [
  {
    value: "public",
    label: "Public User",
    description: "Request ambulances & check symptoms",
  },
  {
    value: "ambulance",
    label: "Ambulance Operator",
    description: "Manage dispatches & enter vitals",
  },
  {
    value: "hospital",
    label: "Hospital Staff",
    description: "Manage beds & incoming patients",
  },
  {
    value: "admin",
    label: "Administrator",
    description: "City-wide oversight & analytics",
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "public",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.role) newErrors.role = "Please select a role";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          phone: formData.phone.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.msg || data.message || "Registration failed.");
        return;
      }

      // Auto-login after registration
      login(data.token, data.user);

      // Redirect based on role
      switch (data.user.role) {
        case "ambulance":
          navigate("/ambulance");
          break;
        case "hospital":
          navigate("/hospital");
          break;
        case "admin":
          navigate("/admin");
          break;
        default:
          navigate("/");
          break;
      }
    } catch (err) {
      console.error("Register error:", err);
      setServerError("Network error. Make sure the server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (fieldName) =>
    `w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-60 ${
      errors[fieldName]
        ? "border-red-500 bg-red-50 dark:bg-red-900/10"
        : "border-gray-300 dark:border-gray-700"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
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
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Create Account
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
            Join MedManage
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <p className="text-red-700 dark:text-red-400 font-medium text-sm">
              {serverError}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          {/* Name */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              className={fieldClass("name")}
              placeholder="John Doe"
              autoComplete="name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs font-semibold mt-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              className={fieldClass("email")}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs font-semibold mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone (optional) */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              Phone{" "}
              <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
              className={fieldClass("phone")}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                className={fieldClass("password")}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-red-500 text-xs font-semibold mt-1">
                  {errors.password}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                className={fieldClass("confirmPassword")}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs font-semibold mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              Account Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all text-left ${
                    formData.role === role.value
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-400"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span
                    className={`text-sm font-bold ${
                      formData.role === role.value
                        ? "text-indigo-700 dark:text-indigo-300"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {role.label}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                    {role.description}
                  </span>
                </label>
              ))}
            </div>
            {errors.role && (
              <p className="text-red-500 text-xs font-semibold mt-1">
                {errors.role}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
