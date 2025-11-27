import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Opportunities({ user, token, showToast }) {
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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

  const handleCreate = async (e) => {
    e && e.preventDefault();
    if (!title || !description) return showToast('Title and description required', 'error');
    setCreating(true);
    try {
      await api.createOpportunity({ title, description }, token);
      setTitle('');
      setDescription('');
      showToast('Opportunity created', 'success');
      await loadOpportunities();
    } catch (err) {
      showToast(err.message || 'Failed to create opportunity', 'error');
    } finally {
      setCreating(false);
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
          <>
            {user.role === 'mentor' && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="card">
                  <h3>Create Opportunity</h3>
                  <form onSubmit={handleCreate}>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} required />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Offer'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <div className="empty-state">
              <h3 className="empty-state-title">No opportunities yet</h3>
              <p>{user.role === 'mentor' ? 'Create an opportunity using the form above.' : 'Mentors can post offers; check back soon.'}</p>
            </div>
          </>
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
