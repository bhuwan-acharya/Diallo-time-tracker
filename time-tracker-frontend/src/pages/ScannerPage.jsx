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
  const [isLocationVerified, setIsLocationVerified] = useState(false); // Tracks if location is verified
  const [workLog, setWorkLog] = useState(null); // Tracks the current work log for the day
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      setIsLoggedIn(true);
      fetchWorkLog(); // Fetch the current work log on load
    }
  }, [navigate]);

  const fetchWorkLog = async () => {
    try {
      const response = await API.get('/api/work-log', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setWorkLog(response.data); // Set the work log state
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setWorkLog(null); // No work log found for today
      } else {
        console.error('Error fetching work log:', error);
        toast.error('Failed to fetch work log. Please try again.');
      }
    }
  };

  const handleScan = async (data) => {
    if (data) {
      try {
        const scannedLocation = JSON.parse(data); // Parse the scanned data
        const isValidLocation = await validateLocation(scannedLocation);

        if (isValidLocation) {
          setQrResult(data);
          setShowScanner(false); // Stop scanning
          setIsLocationVerified(true); // Mark location as verified
          toast.success('Location verified. You can now log your time.', {
            position: 'top-right',
            autoClose: 3000,
          });
        } else {
          setShowScanner(false); // Stop scanning on error
          setIsLocationVerified(false); // Reset location verification
          toast.error('Invalid location. You need to be in the office to log in.', {
            position: 'top-right',
            autoClose: 5000,
          });
        }
      } catch (error) {
        setShowScanner(false); // Stop scanning on error
        setIsLocationVerified(false); // Reset location verification
        toast.error('Invalid QR code format. Please try again.', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } else {
      setShowScanner(false); // Stop scanning on error
      setIsLocationVerified(false); // Reset location verification
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
      toast.error('Please log in first.');
      return;
    }

    // Validate actions based on the current work log state
    if (type === 'Start Work' && workLog?.start_time) {
      toast.error('You have already started work for today.');
      return;
    }
    if (type === 'Break Start' && (!workLog?.start_time || workLog?.break_start)) {
      toast.error('You cannot start a break. Either work has not started or a break is already active.');
      return;
    }
    if (type === 'Break End' && (!workLog?.break_start || !!workLog?.break_end || !!workLog?.finish_time)) {
      toast.error('You cannot end a break. Either a break has not started, it has already ended, or work is already finished.');
      return;
    }
    if (type === 'Finish Work' && (!workLog?.start_time || !!workLog?.finish_time)) {
      toast.error('You cannot finish work. Either work has not started or it is already finished.');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      // Decode the token to get the employeeId
      const payload = JSON.parse(atob(token.split('.')[1]));
      const employeeId = payload.id;

      // Prepare the payload to send to the server
      const payloadData = {
        employeeId,
        type, // Action type (e.g., Start Work, Break Start)
      };

      console.log('Payload being sent:', payloadData);

      // Make API call to log the action
      const response = await API.post('/api/log-work', payloadData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`${type} logged successfully.`);
      setActiveAction(type);
      setShowScanner(true); // Redirect back to scanner
      fetchWorkLog(); // Refresh the work log after the action
    } catch (error) {
      console.error('Error logging action:', error);
      if (error.response) {
        // Show server error message if available
        toast.error(error.response.data.message || 'Failed to log action. Please try again.');
      } else {
        // Show generic error message
        toast.error('Failed to log action. Please try again.');
      }
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
    if (!logEntry.startTime || !logEntry.finishTime) return '-';
    const start = new Date(logEntry.startTime);
    const finish = new Date(logEntry.finishTime);
    const diff = (finish - start) / (1000 * 60 * 60); // Difference in hours
    return diff.toFixed(2);
  };

  const calculateBreakMinutes = (logEntry) => {
    if (!logEntry.breakStart || !logEntry.breakEnd) return '-';
    const start = new Date(logEntry.breakStart);
    const end = new Date(logEntry.breakEnd);
    const diff = (end - start) / (1000 * 60); // Difference in minutes
    return diff.toFixed(0);
  };

  return (
    <div className="scanner-container text-center mt-4">
      <ToastContainer /> {/* Add ToastContainer to render notifications */}
      {showScanner ? (
        <>
          <h3>Employee Time Tracker</h3>
          <QRScanner onScan={handleScan} />
        </>
      ) : isLocationVerified ? (
        <div className="scanner-buttons-container">
          {/* Start Work Button */}
          <button
            className="scanner-btn btn-blue"
            onClick={() => handleAction('Start Work')}
            disabled={
              !!workLog?.finish_time || // Disable if finish_time is logged
              !!workLog?.start_time || // Disable if start_time is already logged
              !!workLog?.break_start // Disable if break_start is logged
            }
          >
            <i className="fas fa-play scanner-btn-icon"></i>
            <span className="scanner-btn-label">Start Work</span>
          </button>

          {/* Break Start Button */}
          <button
            className="scanner-btn btn-orange"
            onClick={() => handleAction('Break Start')}
            disabled={
              !!workLog?.finish_time || // Disable if finish_time is logged
              !workLog?.start_time || // Disable if work hasn't started
              !!workLog?.break_start // Disable if break_start is already logged
            }
          >
            <i className="fas fa-coffee scanner-btn-icon"></i>
            <span className="scanner-btn-label">Break Start</span>
          </button>

          {/* Break End Button */}
          <button
            className="scanner-btn btn-green"
            onClick={() => handleAction('Break End')}
            disabled={
              !!workLog?.finish_time || // Disable if finish_time is logged
              !workLog?.break_start || // Disable if break hasn't started
              !!workLog?.break_end // Disable if break_end is already logged
            }
          >
            <i className="fas fa-check scanner-btn-icon"></i>
            <span className="scanner-btn-label">Break End</span>
          </button>

          {/* Finish Work Button */}
          <button
            className="scanner-btn btn-red"
            onClick={() => handleAction('Finish Work')}
            disabled={
              !!workLog?.finish_time || // Disable if finish_time is logged
              !workLog?.start_time || // Disable if work hasn't started
              (!!workLog?.break_start && !workLog?.break_end)// Disable if break_start is logged
            }
          >
            <i className="fas fa-stop scanner-btn-icon"></i>
            <span className="scanner-btn-label">Finish Work</span>
          </button>
        </div>
      ) : (
        <div className="retry-container">
          <p>Scanning stopped. Please try again.</p>
          <button
            className="scanner-btn btn-blue"
            onClick={() => setShowScanner(true)} // Restart the scanner
          >
            <i className="fas fa-redo scanner-btn-icon"></i>
            <span className="scanner-btn-label">Retry</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ScannerPage;