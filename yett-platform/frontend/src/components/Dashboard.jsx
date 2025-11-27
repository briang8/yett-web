import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Dashboard({ user, token, updateUser, showToast }) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);

  const [recommendModal, setRecommendModal] = useState({ open: false, learner: null, mentorId: '', message: '' });
  const [userProfile, setUserProfile] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    contentUrl: '',
    duration: '30 minutes',
    difficulty: 'Beginner'
  });

  useEffect(() => {
    loadData();
  }, [user, token]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load modules
      const modulesData = await api.getModules();
      setModules(modulesData);

      // Load user profile with progress
      const profileData = await api.getUser(user.id, token);
      setUserProfile(profileData);

      // Load mentorship requests if learner or mentor
      if (user.role === 'learner' || user.role === 'mentor') {
        const requestsData = await api.getMentorshipRequests(token);
        setRequests(requestsData);
      }

      // Load users and stats if admin
      if (user.role === 'admin') {
        const usersData = await api.getAdminUsers(token);
        setUsers(usersData);
        // load mentors for admin recommendation dropdown
        const mentors = await api.getMentors();
        setMentorsList(mentors);
        // admin stats UI removed per request
      }
    } catch (error) {
      showToast(error.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId) => {
    try {
      const response = await api.completeModule(moduleId, token);

      // Update user profile
      const updatedProfile = {
        ...userProfile,
        completedModules: response.completedModules,
        progress: response.progress,
        completedCount: response.completedModules.length
      };
      setUserProfile(updatedProfile);

      // Update user in parent
      updateUser({
        ...user,
        completedModules: response.completedModules
      });

      showToast('Module marked as complete!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to complete module', 'error');
    }
  };

  const handleResetProgress = async () => {
    setResetting(true);
    try {
      const response = await api.resetProgress(user.id, token);

      // Update user profile
      const updatedProfile = {
        ...userProfile,
        completedModules: [],
        progress: 0,
        completedCount: 0
      };
      setUserProfile(updatedProfile);

      // Update user in parent
      updateUser({
        ...user,
        completedModules: []
      });

      setShowResetModal(false);
      showToast('Progress reset successfully!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to reset progress', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.updateMentorshipRequest(requestId, 'accepted', token);
      loadData();
      showToast('Request accepted!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to update request', 'error');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await api.updateMentorshipRequest(requestId, 'declined', token);
      loadData();
      showToast('Request declined', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to update request', 'error');
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      await api.createModule(newModule, token);
      setNewModule({ title: '', description: '', contentUrl: '', duration: '30 minutes', difficulty: 'Beginner' });
      setShowModuleForm(false);
      loadData();
      showToast('Module created successfully!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to create module', 'error');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      await api.deleteModule(moduleId, token);
      loadData();
      showToast('Module deleted successfully!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to delete module', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Learner Dashboard
  if (user.role === 'learner') {
    return (
      <div className="dashboard section">
        <div className="container">
          <div className="dashboard-header">
            <h1 className="dashboard-greeting">Welcome back, {user.name}!</h1>
            <p style={{ color: 'var(--text-light)' }}>Continue your learning journey</p>
          </div>

          <div className="progress-section">
            <h3 style={{ marginBottom: '1rem' }}>Your Progress</h3>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${userProfile?.progress || 0}%` }}></div>
            </div>
            <div className="progress-stats">
              <div className="stat">
                <div className="stat-value">{userProfile?.progress || 0}%</div>
                <div className="stat-label">Complete</div>
              </div>
              <div className="stat">
                <div className="stat-value">{userProfile?.completedCount || 0}/{modules.length}</div>
                <div className="stat-label">Modules</div>
              </div>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="btn btn-danger btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Reset Progress
            </button>
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Available Modules</h3>
          <div className="grid grid-2">
            {modules.map(module => {
              const isCompleted = userProfile?.completedModules?.includes(module.id);
              return (
                <div key={module.id} className="card module-card">
                  <div className={`module-badge badge-${module.difficulty.toLowerCase()}`}>
                    {module.difficulty}
                  </div>
                  <h4 className="card-title">{module.title}</h4>
                  <p className="card-text">{module.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <span>⏱ {module.duration}</span>
                  </div>
                  {isCompleted ? (
                    <div className="module-completed">
                      <span>✓</span> Completed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCompleteModule(module.id)}
                      className="btn btn-primary btn-sm"
                    >
                      Mark as Complete
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {requests.length > 0 && (
            <>
              <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>My Mentorship Requests</h3>
              <div className="card">
                {requests.map(req => (
                  <div key={req.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <strong>{req.mentorName}</strong>
                        <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>{req.topic}</p>
                      </div>
                      <span className={`badge badge-${req.status}`}>{req.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {showResetModal && (
          <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Reset Progress</h3>
                <p style={{ color: 'var(--text-light)' }}>
                  Are you sure you want to reset your progress? This will clear all completed modules.
                </p>
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowResetModal(false)} className="btn btn-ghost" disabled={resetting}>
                  Cancel
                </button>
                <button onClick={handleResetProgress} className="btn btn-danger" disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Reset Progress'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Mentor Dashboard
  if (user.role === 'mentor') {
    return (
      <div className="dashboard section">
        <div className="container">
          <div className="dashboard-header">
            <h1 className="dashboard-greeting">Welcome, {user.name}!</h1>
            <p style={{ color: 'var(--text-light)' }}>Help guide the next generation</p>
          </div>

          <h3 style={{ marginBottom: '1rem' }}>Mentorship Requests</h3>
          {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"></div>
              <h4 className="empty-state-title">No requests yet</h4>
              <p>Learners will send you mentorship requests soon</p>
            </div>
          ) : (
            <div className="card">
              {requests.map(req => (
                <div key={req.id} style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h4>{req.learnerName}</h4>
                      <p style={{ color: 'var(--text-light)', margin: '0.5rem 0' }}><strong>Topic:</strong> {req.topic}</p>
                      <span className={`badge badge-${req.status}`}>{req.status}</span>
                    </div>
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleAcceptRequest(req.id)} className="btn btn-primary btn-sm">
                          Accept
                        </button>
                        <button onClick={() => handleDeclineRequest(req.id)} className="btn btn-ghost btn-sm">
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Recommend modal (admin)
  const handleSendRecommendation = async () => {
    try {
      await api.recommendLearner(recommendModal.learner.id, recommendModal.mentorId, recommendModal.message, token);
      showToast('Recommendation sent to mentor', 'success');
      setRecommendModal({ open: false, learner: null, mentorId: '', message: '' });
    } catch (err) {
      showToast(err.message || 'Failed to send recommendation', 'error');
    }
  };

  // Render recommend modal
  if (recommendModal.open) {
    return (
      <div className="modal-overlay" onClick={() => setRecommendModal({ open: false, learner: null, mentorId: '', message: '' })}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Recommend {recommendModal.learner?.name} to a Mentor</h3>
          </div>
          <div className="form-group">
            <label className="form-label">Select Mentor</label>
            <select className="form-select" value={recommendModal.mentorId} onChange={(e) => setRecommendModal({ ...recommendModal, mentorId: e.target.value })}>
              {mentorsList.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Message (optional)</label>
            <textarea className="form-textarea" value={recommendModal.message} onChange={(e) => setRecommendModal({ ...recommendModal, message: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setRecommendModal({ open: false, learner: null, mentorId: '', message: '' })}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSendRecommendation}>Send Recommendation</button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (user.role === 'admin') {
    return (
      <div className="dashboard section">
        <div className="container">
          <div className="dashboard-header">
            <h1 className="dashboard-greeting">Admin Dashboard </h1>
            <p style={{ color: 'var(--text-light)' }}>Manage the YETT platform</p>
          </div>



          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Module Management</h3>
            <button onClick={() => setShowModuleForm(!showModuleForm)} className="btn btn-primary btn-sm">
              {showModuleForm ? 'Cancel' : '+ Add Module'}
            </button>
          </div>

          {showModuleForm && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <form onSubmit={handleCreateModule}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newModule.title}
                    onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={newModule.description}
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Content URL (optional)</label>
                  <input
                    type="url"
                    className="form-input"
                    value={newModule.contentUrl}
                    onChange={(e) => setNewModule({ ...newModule, contentUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newModule.duration}
                      onChange={(e) => setNewModule({ ...newModule, duration: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select
                      className="form-select"
                      value={newModule.difficulty}
                      onChange={(e) => setNewModule({ ...newModule, difficulty: e.target.value })}
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Create Module</button>
              </form>
            </div>
          )}

          <div className="grid grid-2">
            {modules.map(module => (
              <div key={module.id} className="card">
                <h4 className="card-title">{module.title}</h4>
                <p className="card-text">{module.description}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={() => handleDeleteModule(module.id)} className="btn btn-danger btn-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>User Progress</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Progress</th>
                  <th>Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge">{u.role}</span></td>
                    <td>{u.progress}%</td>
                    <td>{u.completedCount}/{u.totalModules}</td>
                    <td>
                      {u.role === 'learner' && (
                        <button className="btn btn-sm btn-ghost" onClick={() => setRecommendModal({ open: true, learner: u, mentorId: mentorsList[0]?.id || '', message: '' })}>
                          Recommend to Mentor
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default Dashboard;