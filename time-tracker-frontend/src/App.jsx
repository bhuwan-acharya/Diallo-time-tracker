import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ScannerPage from './pages/ScannerPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';

function App() {
  // Helper function to decode the token and extract the role
  const getUserRole = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in localStorage');
        return null;
      }

      const payload = JSON.parse(atob(token.split('.')[1])); // Decode the Base64 payload
      console.log('Decoded token payload:', payload); // Debugging log
      return payload.role || null; // Return the role
    } catch (error) {
      console.error('Error decoding token:', error);
      return null; // Return null if decoding fails
    }
  };

  // Helper function to check if the user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime; // Check if the token is still valid
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  };

  // Centralized role-based redirection
  const RedirectToDashboard = () => {
    const userRole = getUserRole();
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'employee') {
      return <Navigate to="/employee" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  };

  // ProtectedRoute component to guard routes based on authentication and role
  const ProtectedRoute = ({ children, role }) => {
    const userRole = getUserRole();
    console.log('User role:', userRole, 'Required role:', role); // Debugging log

    if (!isAuthenticated()) {
      console.log('User is not authenticated. Redirecting to login.');
      return <Navigate to="/login" replace />;
    }

    if (role && userRole !== role) {
      console.log('User role does not match required role. Redirecting to dashboard.');
      return <RedirectToDashboard />;
    }

    return children;
  };

  return (
    <Router>
      <ToastContainer />
      <Navbar />
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
    
        {/* ScannerPage Route */}
        <Route
          path="/"
          element={
            isAuthenticated() ? <ScannerPage /> : <Navigate to="/login" replace />
          }
        />

        {/* Admin Dashboard Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Employee Dashboard Route */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute role="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard Route (Redirects based on role) */}
        <Route path="/dashboard" element={<RedirectToDashboard />} />

        {/* Catch-all Route (Redirect to login if no match) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;


