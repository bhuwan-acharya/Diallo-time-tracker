import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../index.css';
import logo from '../assets/logo-transparent.png';
import { decodeToken } from '../utils/token'; // Centralized token decoding utility

function Navbar() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Check if the user is logged in by verifying the token
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  // Decode the token to extract user information
  const user = token ? decodeToken(token) : null;
  const username = user?.email || 'User'; // Use email as the username
  const userRole = user?.role || null; // Extract user role

  console.log('Decoded user role:', userRole); // Debugging log

  const handleLogout = () => {
    setShowModal(false);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const closeMenu = () => {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse?.classList.contains('show')) {
      navbarCollapse.classList.remove('show'); // Close the menu
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          {/* Logo redirects to the dashboard based on user role */}
          <Link
            className="navbar-brand"
            to={userRole === 'admin' ? '/admin' : '/'}
            onClick={closeMenu}
          >
            <img src={logo} alt="Logo" style={{ height: '4rem' }} />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              {/* Scanner Link (only visible for non-admin users) */}
              {userRole !== 'admin' && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/"
                    onClick={() => {
                      closeMenu(); // Ensure the menu is closed
                    }}
                  >
                    Scanner
                  </Link>
                </li>
              )}
              {/* Dashboard Link */}
              {isLoggedIn && userRole && (
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to={userRole === 'admin' ? '/admin' : '/employee'}
                    onClick={(e) => {
                      closeMenu();
                    }}
                  >
                    Dashboard
                  </Link>
                </li>
              )}
            </ul>

            <ul className="navbar-nav ms-auto">
              {isLoggedIn ? (
                <>
                  {/* Display username */}
                  <span className="navbar-text me-3">Hi, {username}</span>
                  {/* Logout Button */}
                  <li className="nav-item">
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => setShowModal(true)} // Show modal on click
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <Link
                    className="nav-link btn btn-outline-primary"
                    to="/login"
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop show"></div>

          {/* Modal Content */}
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Logout</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)} // Close modal
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to logout?</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)} // Close modal
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleLogout} // Logout action
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;