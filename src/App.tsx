import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Ideas from '@/pages/Ideas';
import Experiments from '@/pages/Experiments';
import ExperimentDetail from '@/pages/ExperimentDetail';
import CalendarPage from '@/pages/Calendar';
import Channels from '@/pages/Channels';
import Interviews from '@/pages/Interviews';
import Orders from '@/pages/Orders';
import Review from '@/pages/Review';
import Materials from '@/pages/Materials';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/experiments/:id" element={<ExperimentDetail />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/review" element={<Review />} />
          <Route path="/materials" element={<Materials />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
