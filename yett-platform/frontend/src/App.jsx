import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Modules from './components/Modules';
import Mentors from './components/Mentors';
import About from './components/About';
import Quiz from './components/Quiz';
import Opportunities from './components/Opportunities';

// Toast notification component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} role="alert">
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>✕</button>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('yett_user');
    const savedToken = localStorage.getItem('yett_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('yett_user', JSON.stringify(userData));
    localStorage.setItem('yett_token', authToken);
    showToast('Login successful!', 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('yett_user');
    localStorage.removeItem('yett_token');
    showToast('Logged out successfully', 'success');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('yett_user', JSON.stringify(updatedUser));
  };

  return (
    <Router>
      <div className="app">
        <Header user={user} onLogout={handleLogout} />

        <div className="toast-container">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>

        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} showToast={showToast} />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/dashboard" /> : <SignUp onSignUp={handleLogin} showToast={showToast} />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard user={user} token={token} updateUser={updateUser} showToast={showToast} /> : <Navigate to="/login" />}
          />
          <Route
            path="/modules"
            element={user ? <Modules user={user} token={token} updateUser={updateUser} showToast={showToast} /> : <Navigate to="/login" />}
          />
          <Route
            path="/modules/:id/quiz"
            element={user ? <Quiz user={user} token={token} showToast={showToast} /> : <Navigate to="/login" />}
          />
          <Route
            path="/mentors"
            element={user ? <Mentors user={user} token={token} showToast={showToast} /> : <Navigate to="/login" />}
          />
          <Route
            path="/opportunities"
            element={user ? <Opportunities user={user} token={token} showToast={showToast} /> : <Navigate to="/login" />}
          />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;