import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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

      </Routes>
    </Router>
  );
}

export default App;
