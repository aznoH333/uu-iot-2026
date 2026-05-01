import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppShell } from './components/AppShell'
import { ConfigurationPage } from './pages/ConfigurationPage'
import { DevicesPage } from './pages/DevicesPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="devices" element={<DevicesPage />} />
              <Route path="configurations" element={<ConfigurationPage />} />
            </Route>
          </Route>

          <Route path="configuration" element={<Navigate to="/configurations" replace />} />
          <Route path="*" element={<Navigate to="/devices" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
