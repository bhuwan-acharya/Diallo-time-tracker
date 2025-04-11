import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api'; // Import the API service

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      // Call the backend API to send the reset password email
      const response = await API.post('/api/reset-password', { email });
      setMessage(response.data.message || 'Password reset link sent to your email.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send reset password link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2 className="text-center mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Success/Error Message */}
        {message && <div className="alert alert-info mt-3">{message}</div>}

        {/* Back to Login Link */}
        <div className="text-center mt-3">
          <a href="/login" className="back-to-login-link">Back to Login</a>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;


