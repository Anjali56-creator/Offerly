import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import AddInternship from "./pages/AddInternship.jsx";
import MyInternships from "./pages/MyInternships.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import Preferences from "./pages/Preferences.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import FloatingButton from "./components/FloatingButton.jsx";

function App() {
  return (
    <div className="app-shell">
      <Header />
      <FloatingButton />
      <div className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-internship"
            element={
              <ProtectedRoute>
                <AddInternship />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-internship/:id"
            element={
              <ProtectedRoute>
                <AddInternship />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-internships"
            element={
              <ProtectedRoute>
                <MyInternships />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preferences"
            element={
              <ProtectedRoute>
                <Preferences />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listing/:id"
            element={
              <ProtectedRoute>
                <ListingDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/category/:slug"
            element={
              <ProtectedRoute>
                <CategoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
