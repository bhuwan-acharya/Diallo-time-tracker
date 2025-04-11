import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api'; // Import the API service

function UpdatePassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const token = searchParams.get('token'); // Extract the token from the query parameter

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Call the backend API to update the password
      const response = await API.post('/api/update-password', { token, newPassword });
      setMessage(response.data.message || 'Password updated successfully.');
      setTimeout(() => navigate('/login'), 1000); // Redirect to login after 3 seconds
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="update-password-container">
      <div className="update-password-card">
        <h2 className="text-center mb-4">Update Password</h2>
        <form onSubmit={handleSubmit}>
          {/* New Password Input */}
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="form-control"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password Input */}
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-control"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* Success/Error Message */}
        {message && <div className="alert alert-info mt-3">{message}</div>}
      </div>
    </div>
  );
}

export default UpdatePassword;