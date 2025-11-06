import React, { JSX } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Animals from "./pages/Animals";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AnimalType from "./pages/AnimalType";
import { LoaderProvider } from "./context/LoaderContext";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AlertProvider } from "./context/AlertContext";
import Geofences from "./pages/Geofences";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <AuthProvider>
          <SidebarProvider>
            <LoaderProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <PrivateRoute>
                        <Users />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/animals"
                    element={
                      <PrivateRoute>
                        <Animals />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/terms"
                    element={
                      <PrivateRoute>
                        <TermsAndConditions />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/privacy"
                    element={
                      <PrivateRoute>
                        <PrivacyPolicy />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/animalType"
                    element={
                      <PrivateRoute>
                        <AnimalType />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/geofences"
                    element={
                      <PrivateRoute>
                        <Geofences />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </Router>
            </LoaderProvider>
          </SidebarProvider>
        </AuthProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}

export default App;
