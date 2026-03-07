import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Auth Pages
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";

// Public Pages
import LandingPage from "./pages/Public/LandingPage";
import DiseaseAlerts from "./pages/Public/DiseaseAlerts";
import SymptomChecker from "./pages/Public/SymptomChecker";
import RequestAmbulance from "./pages/Public/RequestAmbulance";

// Ambulance Routes
import AmbulanceDashboard from "./pages/Ambulance/AmbulanceDashboard";
import PatientVitalsForm from "./pages/Ambulance/PatientVitalsForm";
import HospitalRecommendations from "./pages/Ambulance/HospitalRecommendations";
import RouteView from "./pages/Ambulance/RouteView";

// Hospital Pages
import HospitalDashboard from "./pages/Hospital/HospitalDashboard";
import IncomingPatientAlert from "./pages/Hospital/IncomingPatientAlert";
import BedManagement from "./pages/Hospital/BedManagement";
import PriorityQueue from "./pages/Hospital/PriorityQueue";

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AnalyticsPanel from "./pages/Admin/AnalyticsPanel";
import HospitalRatings from "./pages/Admin/HospitalRatings";
import LiveMap from "./pages/Admin/LiveMap";

// Shared
import ProtectedRoute from "./components/shared/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Auth Routes ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Public Routes (no auth required) ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/alerts" element={<DiseaseAlerts />} />
        <Route path="/symptoms" element={<SymptomChecker />} />
        <Route path="/request-ambulance" element={<RequestAmbulance />} />

        {/* ── Ambulance Routes (role: ambulance) ── */}
        <Route
          path="/ambulance"
          element={
            <ProtectedRoute roles="ambulance">
              <AmbulanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ambulance/vitals/:caseId"
          element={
            <ProtectedRoute roles="ambulance">
              <PatientVitalsForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ambulance/recommendations/:caseId"
          element={
            <ProtectedRoute roles="ambulance">
              <HospitalRecommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ambulance/route/:caseId"
          element={
            <ProtectedRoute roles="ambulance">
              <RouteView />
            </ProtectedRoute>
          }
        />

        {/* ── Hospital Routes (role: hospital) ── */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute roles="hospital">
              <HospitalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/incoming/:caseId"
          element={
            <ProtectedRoute roles="hospital">
              <IncomingPatientAlert />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/beds"
          element={
            <ProtectedRoute roles="hospital">
              <BedManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hospital/queue"
          element={
            <ProtectedRoute roles="hospital">
              <PriorityQueue />
            </ProtectedRoute>
          }
        />

        {/* ── Admin Routes (role: admin) ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles="admin">
              <AnalyticsPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ratings"
          element={
            <ProtectedRoute roles="admin">
              <HospitalRatings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/map"
          element={
            <ProtectedRoute roles="admin">
              <LiveMap />
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
