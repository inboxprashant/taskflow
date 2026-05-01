import React, { useState } from 'react';
import api from '../api/axios';

export default function MemberModal({ projectId, onClose, onAdded }) {
  const [form, setForm] = useState({ email: '', role: 'MEMBER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/members/${projectId}`, form);
      onAdded(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', borderRadius: 8, padding: '5px 7px', display: 'flex' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2"/>
                  <line x1="19" y1="8" x2="19" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="22" y1="11" x2="16" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              Add Member
            </span>
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-msg">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address *</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="member@example.com"
                style={{ paddingLeft: 38 }}
                required
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', display: 'flex' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
            </div>
            <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              The user must already have an account in TaskFlow.
            </small>
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              className="form-control"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="MEMBER">👤 Member — can view & update task status</option>
              <option value="ADMIN">⭐ Admin — full project management access</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Add Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
