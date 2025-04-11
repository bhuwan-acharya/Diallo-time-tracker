import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRCodeScanner'; // Adjust path if needed
import API from '../services/api';
import { toast, ToastContainer } from 'react-toastify'; // Import toast components
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles

function ScannerPage() {
  const [qrResult, setQrResult] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [showScanner, setShowScanner] = useState(true);
  const [timeSummary, setTimeSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [navigate]);

  const handleScan = async (data) => {
    if (data) {
      try {
        const scannedLocation = JSON.parse(data); // Parse the scanned data
        const isValidLocation = await validateLocation(scannedLocation);

        if (isValidLocation) {
          setQrResult(data);
          setShowScanner(false); // Stop scanning
          toast.success('Location verified. You can now log your time.', {
            position: 'top-right',
            autoClose: 3000,
          });
        } else {
          setShowScanner(false); // Stop scanning on error
          toast.error('Invalid location. You need to be in the office to log in.', {
            position: 'top-right',
            autoClose: 5000,
          });
        }
      } catch (error) {
        setShowScanner(false); // Stop scanning on error
        toast.error('Invalid QR code format. Please try again.', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } else {
      setShowScanner(false); // Stop scanning on error
      toast.warn('No QR code detected. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const validateLocation = async (scannedLocation) => {
    // Replace with actual API call to validate location if needed
    const userLocation = { lat: 40.7128, lng: -74.006 }; // Replace with actual user location
    const distance = calculateDistance(userLocation, scannedLocation);
    return distance <= 0.1; // 100 meters
  };

  const calculateDistance = (loc1, loc2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLng = toRad(loc2.lng - loc1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.lat)) *
        Math.cos(toRad(loc2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleAction = async (type) => {
    if (!isLoggedIn) {
      alert('Please log in first.');
      return;
    }

    const token = localStorage.getItem('token');
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toISOString(); // Save the full ISO datetime

    try {
      // Decode the token to get the employeeId
      const payload = JSON.parse(atob(token.split('.')[1]));
      const employeeId = payload.id;

      // Prepare the payload based on the action type
      const payloadData = {
        employeeId,
        date: currentDate,
      };

      if (type === 'Start Work') {
        payloadData.startTime = currentTime;
      } else if (type === 'Break Start') {
        payloadData.breakStart = currentTime;
      } else if (type === 'Break End') {
        payloadData.breakEnd = currentTime;
      } else if (type === 'Finish Work') {
        payloadData.finishTime = currentTime;
      }

      console.log('Payload being sent:', payloadData);

      // Make API call to log the action
      const response = await API.post('/api/log-work', payloadData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert(`${type} logged successfully.`);
      setActiveAction(type);
      setShowScanner(true); // Redirect back to scanner
      updateTimeSummary(response.data); // Update time summary with the response
    } catch (error) {
      console.error('Error logging action:', error);
      alert('Failed to log action. Please try again.');
    }
  };

  const updateTimeSummary = (logEntry) => {
    if (logEntry.startTime) {
      const startTime = new Date(logEntry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const workedHours = calculateWorkedHours(logEntry);
      const breakMinutes = calculateBreakMinutes(logEntry);
      setTimeSummary({ startTime, workedHours, breakMinutes });
    } else {
      setTimeSummary(null);
    }
  };

  const calculateWorkedHours = (logEntry) => {
    if (logEntry.startTime && logEntry.finishTime) {
      const start = new Date(logEntry.startTime);
      const finish = new Date(logEntry.finishTime);
      const diff = (finish - start) / (1000 * 60 * 60); // Difference in hours
      return diff.toFixed(2);
    }
    return '-';
  };

  const calculateBreakMinutes = (logEntry) => {
    if (logEntry.breakStart && logEntry.breakEnd) {
      const breakStart = new Date(logEntry.breakStart);
      const breakEnd = new Date(logEntry.breakEnd);
      const diff = (breakEnd - breakStart) / (1000 * 60); // Difference in minutes
      return diff.toFixed(0);
    }
    return '-';
  };

  return (
    <div className="scanner-container text-center mt-4">
      <ToastContainer /> {/* Add ToastContainer to render notifications */}
      {showScanner ? (
        <>
          <h3>Employee Time Tracker</h3>
          <QRScanner onScan={handleScan} />
        </>
      ) : qrResult ? (
        <>
          {/* Show buttons when a successful scan occurs */}
          <div className="scanner-buttons-container">
            {[
              { action: 'Start Work', label: 'Start Shift', icon: '🕒', color: 'btn-blue' },
              { action: 'Break Start', label: 'Start Break', icon: '☕', color: 'btn-green' },
              { action: 'Break End', label: 'End Break', icon: '🔄', color: 'btn-orange' },
              { action: 'Finish Work', label: 'End Shift', icon: '✅', color: 'btn-red' },
            ].map(({ action, label, icon, color }) => (
              <button
                key={action}
                className={`scanner-btn ${color}`}
                onClick={() => handleAction(action)}
                disabled={action === 'Start Work' && activeAction === 'Start Work'}
              >
                <span className="scanner-btn-icon">{icon}</span>
                <span className="scanner-btn-label">{label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="retry-container">
          {/* Show retry option when an error occurs */}
          <p>Scanning stopped due to an error. Please try again.</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowScanner(true)} // Restart the scanner
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default ScannerPage;