import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';
import MemberModal from '../components/MemberModal';
import './ProjectDetailPage.css';

const statusBadge = (status) => {
  const map = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in_progress', DONE: 'badge-done' };
  const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
  return <span className={`badge ${map[status]}`}>{labels[status]}</span>;
};

const priorityBadge = (priority) => {
  const map = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
  return <span className={`badge ${map[priority]}`}>{priority}</span>;
};

const isOverdue = (task) =>
  task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date();

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskFilter, setTaskFilter] = useState({ status: '', priority: '' });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const fetchProject = () => {
    api.get(`/projects/${projectId}`)
      .then((res) => setProject(res.data))
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProject(); }, [projectId]);

  const isAdmin = project?.myRole === 'ADMIN';

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${projectId}/${taskId}`);
      setProject((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await api.put(`/tasks/${projectId}/${task.id}`, { status: newStatus });
      setProject((p) => ({
        ...p,
        tasks: p.tasks.map((t) => (t.id === task.id ? res.data : t)),
      }));
    } catch {
      alert('Failed to update status');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/members/${projectId}/${memberId}`);
      setProject((p) => ({ ...p, members: p.members.filter((m) => m.userId !== memberId) }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const res = await api.put(`/members/${projectId}/${memberId}`, { role: newRole });
      setProject((p) => ({
        ...p,
        members: p.members.map((m) => (m.userId === memberId ? { ...m, role: res.data.role } : m)),
      }));
    } catch {
      alert('Failed to update role');
    }
  };

  if (loading) return (
    <div className="page-loader">
      <div className="spinner spinner-dark" />
      <span>Loading project…</span>
    </div>
  );
  if (!project) return null;

  const filteredTasks = project.tasks.filter((t) => {
    if (taskFilter.status && t.status !== taskFilter.status) return false;
    if (taskFilter.priority && t.priority !== taskFilter.priority) return false;
    return true;
  });

  const taskCounts = {
    TODO: project.tasks.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    DONE: project.tasks.filter((t) => t.status === 'DONE').length,
  };

  return (
    <div className="project-detail">
      {/* Header */}
      <div className="project-detail-header">
        <div className="project-detail-title">
          <button className="back-btn" onClick={() => navigate('/projects')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Projects
          </button>
          <div>
            <h1>{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
          <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-member'}`}>
            {isAdmin ? (
              <><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Admin</>
            ) : 'Member'}
          </span>
        </div>
        {isAdmin && (
          <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Delete Project
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="task-summary">
        <div className="summary-item">
          <span className="summary-count" style={{ color: '#64748b' }}>{taskCounts.TODO}</span>
          <span className="summary-label">To Do</span>
        </div>
        <div className="summary-item in-progress">
          <span className="summary-count" style={{ color: '#d97706' }}>{taskCounts.IN_PROGRESS}</span>
          <span className="summary-label">In Progress</span>
        </div>
        <div className="summary-item done">
          <span className="summary-count" style={{ color: '#16a34a' }}>{taskCounts.DONE}</span>
          <span className="summary-label">Done</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Tasks ({project.tasks.length})
        </button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Members ({project.members.length})
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="tab-content">
          <div className="tasks-toolbar">
            <div className="filters">
              <select
                className="form-control"
                value={taskFilter.status}
                onChange={(e) => setTaskFilter({ ...taskFilter, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <select
                className="form-control"
                value={taskFilter.priority}
                onChange={(e) => setTaskFilter({ ...taskFilter, priority: e.target.value })}
              >
                <option value="">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                Add Task
              </button>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-state card" style={{ padding: 48 }}>
              <span className="icon">📭</span>
              <h3>No tasks found</h3>
              <p>{isAdmin ? 'Create the first task for this project.' : 'No tasks match your filters.'}</p>
            </div>
          ) : (
            <div className="tasks-table card">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className={isOverdue(task) ? 'overdue-row' : ''}>
                      <td>
                        <div className="task-title-cell">
                          <span className="task-title">{task.title}</span>
                          {task.description && (
                            <span className="task-desc-preview">{task.description}</span>
                          )}
                          {isOverdue(task) && (
                            <span className="overdue-tag">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value)}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      </td>
                      <td>{priorityBadge(task.priority)}</td>
                      <td>
                        {task.assignee ? (
                          <div className="assignee-cell">
                            <div className="mini-avatar">{task.assignee.name.charAt(0)}</div>
                            {task.assignee.name}
                          </div>
                        ) : (
                          <span className="unassigned">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {task.dueDate ? (
                          <span className={isOverdue(task) ? 'overdue-date' : ''} style={{ fontSize: 13 }}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="action-btns">
                            <button
                              className="btn btn-secondary btn-sm btn-icon"
                              title="Edit task"
                              onClick={() => { setEditingTask(task); setShowTaskModal(true); }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button
                              className="btn btn-danger btn-sm btn-icon"
                              title="Delete task"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="tab-content">
          <div className="members-toolbar">
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Add Member
              </button>
            )}
          </div>
          <div className="members-list card">
            {project.members.map((member) => (
              <div key={member.id} className="member-row">
                <div className="member-info">
                  <div className="member-avatar">{member.user.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="member-name">
                      {member.user.name}
                      {member.user.id === user.id && <span className="you-tag">you</span>}
                    </div>
                    <div className="member-email">{member.user.email}</div>
                  </div>
                </div>
                <div className="member-actions">
                  {isAdmin && member.user.id !== project.ownerId ? (
                    <select
                      className="form-control"
                      style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>
                  ) : (
                    <span className={`badge ${member.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>
                      {member.role === 'ADMIN' ? (
                        <><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Admin</>
                      ) : 'Member'}
                    </span>
                  )}
                  {isAdmin && member.user.id !== project.ownerId && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveMember(member.userId)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        <line x1="17" y1="8" x2="23" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="23" y1="8" x2="17" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          projectId={parseInt(projectId)}
          members={project.members}
          task={editingTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSaved={(savedTask) => {
            if (editingTask) {
              setProject((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === savedTask.id ? savedTask : t)) }));
            } else {
              setProject((p) => ({ ...p, tasks: [savedTask, ...p.tasks] }));
            }
            setShowTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}

      {showMemberModal && (
        <MemberModal
          projectId={parseInt(projectId)}
          onClose={() => setShowMemberModal(false)}
          onAdded={(member) => {
            setProject((p) => ({ ...p, members: [...p.members, member] }));
            setShowMemberModal(false);
          }}
        />
      )}
    </div>
  );
}
