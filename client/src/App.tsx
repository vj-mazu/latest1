import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { setNotificationCallback } from './utils/toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Arrivals from './pages/Arrivals';
import Records from './pages/Records';
import Locations from './pages/Locations';
import KunchinintuLedger from './pages/KunchinintuLedger';
import RiceLedger from './pages/RiceLedger';
import Hamali from './pages/Hamali';
import AddPurchaseRate from './pages/AddPurchaseRate';
import HamaliBookSimple from './pages/HamaliBookSimple';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './globalNotification.css';
import './App.css';

const AppContent: React.FC = () => {
  const notification = useNotification();

  useEffect(() => {
    // Connect our custom toast to the notification system
    setNotificationCallback({
      success: notification.success,
      error: notification.error,
      warning: notification.warning,
      info: notification.info
    });
  }, [notification]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/arrivals"
            element={
              <ProtectedRoute>
                <Layout>
                  <Arrivals />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/records"
            element={
              <ProtectedRoute>
                <Layout>
                  <Records />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <Layout>
                  <Locations />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ledger"
            element={
              <ProtectedRoute>
                <Layout>
                  <KunchinintuLedger />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rice-ledger"
            element={
              <ProtectedRoute>
                <Layout>
                  <RiceLedger />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hamali"
            element={
              <ProtectedRoute>
                <Layout>
                  <Hamali />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/records/purchase/:arrivalId/add-rate"
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <Layout>
                  <AddPurchaseRate />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hamali-book"
            element={
              <ProtectedRoute roles={['manager', 'admin']}>
                <Layout>
                  <HamaliBookSimple />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
