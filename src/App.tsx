import { Routes, Route, Navigate } from 'react-router-dom';
import RoleSelectPage from './pages/RoleSelectPage';
import CheckerPage from './pages/CheckerPage';
import PackagingPage from './pages/PackagingPage';
import VerifikatorPage from './pages/VerifikatorPage';
import DeliveryPage from './pages/DeliveryPage';
import BarangTitipanPage from './pages/BarangTitipanPage';
import SalesPage from './pages/SalesPage';
import CatalogPage from './pages/CatalogPage';
import CatalogLoginPage from './pages/CatalogLoginPage';
import CatalogAdminPage from './pages/CatalogAdminPage';
import TrackingLoginPage from './pages/TrackingLoginPage';
import TrackingMenuPage from './pages/TrackingMenuPage';
import TrackingSubmitPage from './pages/TrackingSubmitPage';
import TrackingDiterimaPage from './pages/TrackingDiterimaPage';
import OwnerLoginPage from './pages/OwnerLoginPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelectPage />} />
      <Route path="/checker" element={<CheckerPage />} />
      <Route path="/packaging" element={<PackagingPage />} />
      <Route path="/verifikator" element={<VerifikatorPage />} />
      <Route path="/delivery" element={<DeliveryPage />} />
      <Route path="/barangtitipan" element={<BarangTitipanPage />} />
      <Route path="/sales" element={<SalesPage />} />
      <Route path="/katalog" element={<CatalogPage />} />
      <Route path="/katalog/login" element={<CatalogLoginPage />} />
      <Route path="/katalog/admin" element={<CatalogAdminPage />} />
      <Route path="/tracking" element={<TrackingLoginPage />} />
      <Route path="/tracking/menu" element={<TrackingMenuPage />} />
      <Route path="/tracking/submit" element={<TrackingSubmitPage />} />
      <Route path="/tracking/diterima" element={<TrackingDiterimaPage />} />
      <Route path="/owner" element={<OwnerLoginPage />} />
      <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;