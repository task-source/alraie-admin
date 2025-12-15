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
import Breeds from "./pages/Breeds";
import Slides from "./pages/Slides";
import Gps from "./pages/Gps";
import UserDetails from "./pages/UserDetails";
import AnimalDetails from "./pages/AnimalDetails";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import ProductDetails from "./pages/ProductDetail";
import ProductEdit from "./pages/ProductEdit";
import Orders from "./pages/Orders";

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
                    path="/breeds"
                    element={
                      <PrivateRoute>
                        <Breeds />
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
                  <Route
                    path="/gps"
                    element={
                      <PrivateRoute>
                        <Gps />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/slides"
                    element={
                      <PrivateRoute>
                        <Slides />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <PrivateRoute>
                        <Products />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/products/new"
                    element={
                      <PrivateRoute>
                        <AddProduct />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/products/:id"
                    element={
                      <PrivateRoute>
                        <ProductDetails />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/products/:id/edit"
                    element={
                      <PrivateRoute>
                        <ProductEdit />
                      </PrivateRoute>
                    }
                  />

                  <Route
                    path="/orders"
                    element={
                      <PrivateRoute>
                        <Orders />
                      </PrivateRoute>
                    }
                  />
                    <Route path="/user/:id" element={<UserDetails />} />
                    <Route path="/animal/:id" element={<AnimalDetails />} />
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
