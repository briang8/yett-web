import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Opportunities({ user, token, showToast }) {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const data = await api.getOpportunities(token);
      setOpps(data);
    } catch (err) {
      showToast(err.message || 'Failed to load opportunities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id, status) => {
    setRespondingId(id);
    try {
      await api.respondOpportunity(id, status, token);
      showToast('Response recorded', 'success');
      await loadOpportunities();
    } catch (err) {
      showToast(err.message || 'Failed to respond', 'error');
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) return (
    <div className="loading"><div className="spinner"></div><p>Loading opportunities...</p></div>
  );

  return (
    <div className="section">
      <div className="container">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1>Opportunities</h1>
          <p style={{ color: 'var(--text-light)' }}>Browse offers from mentors and apply or accept ones aimed at you.</p>
        </div>

        {opps.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">No opportunities yet</h3>
            <p>Mentors can post offers; check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {opps.map(opp => (
              <div key={opp.id} className="card">
                <h3 className="card-title">{opp.title}</h3>
                <p className="card-text">{opp.description}</p>
                <p style={{ color: 'var(--text-lighter)', fontSize: '0.9rem' }}>Posted by: {opp.mentorId}</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  {user.role === 'learner' && opp.status === 'open' && (
                    <>
                      <button className="btn btn-primary" onClick={() => handleRespond(opp.id, 'accepted')} disabled={respondingId === opp.id}>Accept</button>
                      <button className="btn btn-ghost" onClick={() => handleRespond(opp.id, 'declined')} disabled={respondingId === opp.id}>Decline</button>
                    </>
                  )}
                  <span className="badge" style={{ marginLeft: 'auto' }}>{opp.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Opportunities;
