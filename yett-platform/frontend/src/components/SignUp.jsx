import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

function SignUp({ onSignUp, showToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'learner',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [pwStrength, setPwStrength] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'password') {
      const v = e.target.value;
      if (v.length >= 12) setPwStrength('strong');
      else if (v.length >= 8) setPwStrength('medium');
      else setPwStrength('weak');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.register(formData);
      onSignUp(response.user, response.token);
      showToast('Account created successfully!', 'success');
      navigate('/dashboard');
    } catch (error) {
      showToast(error.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container">
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div className="card">
            <h2>Create Your Account</h2>
            <p className="card-text">Join YETT and start your learning journey today</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role" className="form-label">I want to join as</label>
                <select
                  id="role"
                  name="role"
                  className="form-select"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="learner">Learner - I want to learn and grow</option>
                  <option value="mentor">Mentor - I want to guide others</option>
                  {/* Admin creation is restricted — hidden from public signup */}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                  disabled={loading}
                />

                <div className="password-strength" aria-hidden>
                  <div className={`password-strength-bar ${pwStrength === 'strong' ? 'password-strength-strong' : pwStrength === 'medium' ? 'password-strength-medium' : 'password-strength-weak'}`}></div>
                </div>

                <div className="password-requirements">
                  <div className={`password-requirement ${formData.password.length >= 8 ? 'met' : 'unmet'}`}>Minimum 8 characters</div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-light)' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;