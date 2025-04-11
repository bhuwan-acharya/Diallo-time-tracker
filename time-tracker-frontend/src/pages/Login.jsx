import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import API from '../services/api'; // Import the API service
import { decodeToken } from '../utils/token'; // Import the token decoding utility
import { toast } from 'react-toastify'; // Import toast
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles

function Login() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        const response = await API.post('/api/login', values); // Call the backend login API
        const { token, refreshToken } = response.data;

        // Save tokens to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        // Decode the token to check the user's role
        const user = decodeToken(token);
        const userRole = user?.role;

        // Redirect based on the user's role
        if (userRole === 'admin') {
          window.location.href = '/admin'; // Force reload to AdminDashboard
        } else {
          window.location.href = '/'; // Force reload to EmployeeDashboard
        }
      } catch (error) {
        console.error('Login failed:', error.response?.data?.message || error.message);
        // Show toast notification for errors
        toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      }
    },
  });

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="text-center mb-4">Welcome Back</h2>
        <form onSubmit={formik.handleSubmit}>
          {/* Email Input */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
              placeholder="Enter your email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.email && formik.errors.email ? (
              <div className="invalid-feedback">{formik.errors.email}</div>
            ) : null}
          </div>

          {/* Password Input */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form-control ${formik.touched.password && formik.errors.password ? 'is-invalid' : ''}`}
              placeholder="Enter your password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.password && formik.errors.password ? (
              <div className="invalid-feedback">{formik.errors.password}</div>
            ) : null}
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>

        {/* Forgot Password Link */}
        <div className="text-center mt-3">
          <a href="/reset-password" className="forgot-password-link">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}

export default Login;