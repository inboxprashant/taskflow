import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message
        || err.message
        || 'Login failed. Please try again.';
      setError(msg);
      console.error('Login error:', err.response?.status, err.response?.data, err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => setForm({ email, password: 'password123' });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="white" strokeWidth="2"/>
              <path d="M9 12h6M9 16h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>TaskFlow</h1>
        </div>

        <h2>Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {error && (
          <div className="error-msg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" flexShrink="0">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email address</label>
            <div className="input-wrapper">
              <input
                className="form-control"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
            </div>
          </div>

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="demo-accounts">
          <div className="demo-accounts-label">Quick demo access</div>
          <div className="demo-btns">
            <button className="demo-btn demo-btn-admin" onClick={() => fillDemo('alice@demo.com')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              </svg>
              Admin (Alice)
            </button>
            <button className="demo-btn demo-btn-member" onClick={() => fillDemo('bob@demo.com')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Member (Bob)
            </button>
          </div>
        </div>

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
