import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header({ user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            YETT
          </Link>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
            <Link to="/" className={isActive('/')} onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/modules" className={isActive('/modules')} onClick={() => setMobileMenuOpen(false)}>
                  Programs
                </Link>
                {user.role === 'learner' && (
                  <Link to="/mentors" className={isActive('/mentors')} onClick={() => setMobileMenuOpen(false)}>
                    Mentors
                  </Link>
                )}
              </>
            )}
            <Link to="/about" className={isActive('/about')} onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <Link to="/opportunities" className={isActive('/opportunities')} onClick={() => setMobileMenuOpen(false)}>
              Opportunities
            </Link>
            {user ? (
              <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="btn btn-sm btn-ghost">
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn btn-sm btn-ghost" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;