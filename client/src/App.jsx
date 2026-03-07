import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import LandingPage from './pages/Public/LandingPage';
import DiseaseAlerts from './pages/Public/DiseaseAlerts';
import SymptomChecker from './pages/Public/SymptomChecker';
import RequestAmbulance from './pages/Public/RequestAmbulance';

// Ambulance Routes
import AmbulanceDashboard from './pages/Ambulance/AmbulanceDashboard';
import PatientVitalsForm from './pages/Ambulance/PatientVitalsForm';
import HospitalRecommendations from './pages/Ambulance/HospitalRecommendations';
import RouteView from './pages/Ambulance/RouteView';

// Hospital Pages
import HospitalDashboard from './pages/Hospital/HospitalDashboard';
import IncomingPatientAlert from './pages/Hospital/IncomingPatientAlert';
import BedManagement from './pages/Hospital/BedManagement';
import PriorityQueue from './pages/Hospital/PriorityQueue';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AnalyticsPanel from './pages/Admin/AnalyticsPanel';
import HospitalRatings from './pages/Admin/HospitalRatings';
import LiveMap from './pages/Admin/LiveMap';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/alerts" element={<DiseaseAlerts />} />
        <Route path="/symptoms" element={<SymptomChecker />} />
        <Route path="/request-ambulance" element={<RequestAmbulance />} />

        {/* Ambulance Routes */}
        <Route path="/ambulance" element={<AmbulanceDashboard />} />
        <Route path="/ambulance/vitals" element={<PatientVitalsForm />} />
        <Route path="/ambulance/vitals/:caseId" element={<PatientVitalsForm />} />
        <Route path="/ambulance/recommendations" element={<HospitalRecommendations />} />
        <Route path="/ambulance/recommendations/:caseId" element={<HospitalRecommendations />} />
        <Route path="/ambulance/route" element={<RouteView />} />
        <Route path="/ambulance/route/:caseId" element={<RouteView />} />

        {/* Hospital Routes */}
        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/hospital/incoming/:caseId" element={<IncomingPatientAlert />} />
        <Route path="/hospital/beds" element={<BedManagement />} />
        <Route path="/hospital/queue" element={<PriorityQueue />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<AnalyticsPanel />} />
        <Route path="/admin/ratings" element={<HospitalRatings />} />
        <Route path="/admin/map" element={<LiveMap />} />
      </Routes>
    </Router>
  );
}

export default App;
