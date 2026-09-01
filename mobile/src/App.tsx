import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { RequireAuth } from './components/RequireAuth';
import { Login } from './pages/Login';
import { Handoff } from './pages/Handoff';
import { Home } from './pages/Home';
import { MapPage } from './pages/MapPage';
import { Maintenance } from './pages/Maintenance';
import { Alerts } from './pages/Alerts';
import { Trips } from './pages/Trips';
import { Profile } from './pages/Profile';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/handoff" element={<Handoff />} />
      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/mantenimiento" element={<Maintenance />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>
      <Route
        path="/recorridos"
        element={
          <RequireAuth>
            <Trips />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
