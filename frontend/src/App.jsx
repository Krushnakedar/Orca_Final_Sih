import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import RoutesPage from "./pages/RoutesPage";
import AlertsPage from "./pages/AlertsPage";
import PFZPage from "./pages/PFZPage";
import ChatPage from "./pages/ChatPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { OfflineProvider } from "./context/OfflineContext";
import { PendingActionProvider } from "./context/PendingActionContext";
import { SyncProvider } from "./context/SyncContext";
import { checkHealth } from "./services/healthService";

export default function App() {
  const [apiStatus, setApiStatus] = useState({
    connected: false,
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const probeBackendHealth = async () => {
      try {
        const response = await checkHealth();
        if (isMounted) {
          setApiStatus({
            connected: true,
            loading: false,
            data: response,
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setApiStatus({
            connected: false,
            loading: false,
            data: null,
            error: err.message,
          });
        }
      }
    };

    probeBackendHealth();
    const interval = setInterval(probeBackendHealth, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <ErrorBoundary>
      <OfflineProvider>
        <PendingActionProvider>
          <AuthProvider>
            <SyncProvider>
              <LanguageProvider>
                <BrowserRouter>
                  <MainLayout apiStatus={apiStatus}>
                    <Routes>
                      <Route
                        path="/"
                        element={<HomePage apiStatus={apiStatus} />}
                      />
                      <Route
                        path="/chat"
                        element={
                          <ProtectedRoute>
                            {" "}
                            <ChatPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/map"
                        element={
                          <ProtectedRoute>
                            {" "}
                            <MapPage />{" "}
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/routes"
                        element={
                          <ProtectedRoute>
                            {" "}
                            <RoutesPage />{" "}
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/alerts"
                        element={
                          <ProtectedRoute>
                            {" "}
                            <AlertsPage />{" "}
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/pfz"
                        element={
                          <ProtectedRoute>
                            {" "}
                            <PFZPage />{" "}
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/history"
                        element={
                          <ProtectedRoute>
                            {" "}
                            <HistoryPage />{" "}
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            {" "}
                            <DashboardPage apiStatus={apiStatus} />{" "}
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </MainLayout>
                </BrowserRouter>
              </LanguageProvider>
            </SyncProvider>
          </AuthProvider>
        </PendingActionProvider>
      </OfflineProvider>
    </ErrorBoundary>
  );
}
