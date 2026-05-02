import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="stat-card card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

const statusBadge = (status) => {
  const map = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in_progress', DONE: 'badge-done' };
  const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
};

const priorityBadge = (priority) => {
  const map = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
  return <span className={`badge ${map[priority]}`}>{priority}</span>;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-loader">
      <div className="spinner spinner-dark" />
      <span>Loading dashboard…</span>
    </div>
  );

  if (error || !data) return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back, <strong>{user?.name}</strong> 👋</p>
        </div>
      </div>
      <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ marginBottom: 8, color: 'var(--text)' }}>Could not load dashboard data</h3>
        <p style={{ marginBottom: 16 }}>{error || 'API is unreachable. Check your backend connection.'}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    </div>
  );

  const { stats, recentAssignedTasks, overdueTasksList } = data;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back, <strong>{user?.name}</strong> 👋</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 012-2h3.17a2 2 0 011.42.59l1.41 1.41A2 2 0 0012.41 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>}
          label="Total Projects" value={stats.totalProjects} color="#6366f1" bg="#eef2ff"
        />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/></svg>}
          label="Total Tasks" value={stats.totalTasks} color="#3b82f6" bg="#eff6ff"
        />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
          label="In Progress" value={stats.inProgressTasks} color="#f59e0b" bg="#fffbeb"
        />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="Completed" value={stats.doneTasks} color="#22c55e" bg="#f0fdf4"
        />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
          label="Overdue" value={stats.overdueTasks} color="#ef4444" bg="#fef2f2"
        />
        <StatCard
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>}
          label="Assigned to Me" value={stats.myAssignedTasks} color="#8b5cf6" bg="#f5f3ff"
        />
      </div>

      <div className="dashboard-grid">
        {/* My Tasks */}
        <div className="card dashboard-section">
          <div className="section-header">
            <h2>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="#6366f1" strokeWidth="2"/></svg>
              My Recent Tasks
            </h2>
          </div>
          {recentAssignedTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <span className="icon">📭</span>
              <h3>No tasks assigned</h3>
              <p>You have no tasks assigned to you yet.</p>
            </div>
          ) : (
            <div className="task-list">
              {recentAssignedTasks.map((task) => (
                <div key={task.id} className="task-row">
                  <div className="task-row-main">
                    <div className="task-row-title">{task.title}</div>
                    <div className="task-row-meta">
                      <Link to={`/projects/${task.project.id}`} className="project-link">
                        📁 {task.project.name}
                      </Link>
                    </div>
                  </div>
                  <div className="task-row-badges">
                    {statusBadge(task.status)}
                    {priorityBadge(task.priority)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Tasks */}
        <div className="card dashboard-section">
          <div className="section-header">
            <h2>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
              Overdue Tasks
            </h2>
          </div>
          {overdueTasksList.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <span className="icon">🎉</span>
              <h3>All caught up!</h3>
              <p>No overdue tasks. Great work!</p>
            </div>
          ) : (
            <div className="task-list">
              {overdueTasksList.map((task) => (
                <div key={task.id} className="task-row overdue">
                  <div className="task-row-main">
                    <div className="task-row-title">{task.title}</div>
                    <div className="task-row-meta">
                      <Link to={`/projects/${task.project.id}`} className="project-link">
                        📁 {task.project.name}
                      </Link>
                      {task.assignee && <span>· 👤 {task.assignee.name}</span>}
                      <span className="overdue-date">
                        · Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="task-row-badges">
                    {priorityBadge(task.priority)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
