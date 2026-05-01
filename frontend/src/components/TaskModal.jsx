import React, { useState } from 'react';
import api from '../api/axios';

export default function TaskModal({ projectId, members, task, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    assigneeId: task?.assigneeId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      ...form,
      assigneeId: form.assigneeId ? parseInt(form.assigneeId) : null,
      dueDate: form.dueDate || null,
    };
    try {
      let res;
      if (isEdit) {
        res = await api.put(`/tasks/${projectId}/${task.id}`, payload);
      } else {
        res = await api.post(`/tasks/${projectId}`, payload);
      }
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save task');
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
              <span style={{ background: isEdit ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8, padding: '5px 7px', display: 'flex' }}>
                {isEdit ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke="white" strokeWidth="2"/>
                    <line x1="12" y1="11" x2="12" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="9" y1="14" x2="15" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </span>
              {isEdit ? 'Edit Task' : 'Create Task'}
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
            <label>Title *</label>
            <input
              className="form-control"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Add more details…"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                <option value="TODO">📋 To Do</option>
                <option value="IN_PROGRESS">⏳ In Progress</option>
                <option value="DONE">✅ Done</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" name="priority" value={form.priority} onChange={handleChange}>
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="HIGH">🔴 High</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Due Date</label>
              <input
                className="form-control"
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Assignee</label>
              <select className="form-control" name="assigneeId" value={form.assigneeId} onChange={handleChange}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                  {isEdit ? 'Save Changes' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
