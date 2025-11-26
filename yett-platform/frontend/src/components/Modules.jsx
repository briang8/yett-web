import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

function Modules({ user, token, updateUser, showToast }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modulesData, profileData] = await Promise.all([
        api.getModules(),
        api.getUser(user.id, token)
      ]);
      setModules(modulesData);
      setUserProfile(profileData);
    } catch (error) {
      showToast(error.message || 'Failed to load modules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId) => {
    try {
      const response = await api.completeModule(moduleId, token);

      const updatedProfile = {
        ...userProfile,
        completedModules: response.completedModules,
        progress: response.progress,
        completedCount: response.completedModules.length
      };
      setUserProfile(updatedProfile);

      updateUser({
        ...user,
        completedModules: response.completedModules
      });

      showToast('Module marked as complete!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to complete module', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading modules...</p>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h1>Learning Programs</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '1.125rem' }}>
            Explore our collection of digital literacy courses
          </p>
        </div>

        {user.role === 'learner' && userProfile && (
          <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--primary) 0%, #5A3DC9 100%)', color: 'white' }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Your Progress</h3>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${userProfile.progress}%` }}></div>
            </div>
            <p style={{ marginTop: '1rem', opacity: 0.9 }}>
              {userProfile.completedCount} of {modules.length} modules completed ({userProfile.progress}%)
            </p>
          </div>
        )}

        <div className="grid grid-2">
          {modules.map(module => {
            const isCompleted = userProfile?.completedModules?.includes(module.id);
            return (
              <div key={module.id} className="card module-card">
                <div className={`module-badge badge-${module.difficulty.toLowerCase()}`}>
                  {module.difficulty}
                </div>
                <h3 className="card-title">{module.title}</h3>
                <p className="card-text">{module.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <span>{module.duration}</span>
                </div>

                <div className="module-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {module.contentUrl && (
                    <a
                      href={module.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      View Content
                    </a>
                  )}

                  {user.role === 'learner' && (
                    isCompleted ? (
                      <div className="module-completed" style={{ alignSelf: 'center' }}>
                        Completed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCompleteModule(module.id)}
                        className="btn btn-primary btn-sm"
                      >
                        Mark as Complete
                      </button>
                    )
                  )}

                  {user.role === 'learner' && (
                    <Link to={`/modules/${module.id}/quiz`} className="btn btn-secondary btn-sm">
                      Take Quiz
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {modules.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3 className="empty-state-title">No modules available yet</h3>
            <p>Check back soon for new learning content</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Modules;