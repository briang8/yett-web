import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Mentors({ user, token, showToast }) {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [topic, setTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [opportunityTitle, setOpportunityTitle] = useState('');
  const [opportunityDesc, setOpportunityDesc] = useState('');
  const [creatingOpportunity, setCreatingOpportunity] = useState(false);
  const [topLearners, setTopLearners] = useState([]);
  const [selectedLearnerForOffer, setSelectedLearnerForOffer] = useState(null);

  useEffect(() => {
    loadMentors();
    if (user && user.role === 'mentor') loadTopLearners();
  }, []);

  const loadMentors = async () => {
    setLoading(true);
    try {
      const data = await api.getMentors();
      setMentors(data);
    } catch (error) {
      showToast(error.message || 'Failed to load mentors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMentor = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.createMentorshipRequest({
        mentorId: selectedMentor.id,
        topic
      }, token);

      setSelectedMentor(null);
      setTopic('');
      showToast('Mentorship request sent!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to send request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    setCreatingOpportunity(true);
    try {
      await api.createOpportunity({ title: opportunityTitle, description: opportunityDesc }, token);
      setOpportunityTitle('');
      setOpportunityDesc('');
      showToast('Opportunity created', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create opportunity', 'error');
    } finally {
      setCreatingOpportunity(false);
    }
  };

  const loadTopLearners = async () => {
    try {
      const data = await api.getTopLearners(token);
      setTopLearners(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch top learners', 'error');
    }
  };

  const handleOfferToLearner = async (learner) => {
    setSelectedLearnerForOffer(learner);
    // open modal prefilled
    setOpportunityTitle(`Mentorship offer: ${learner.name}`);
    setOpportunityDesc(`I'd like to offer mentorship to ${learner.name}. Reply if interested.`);
  };

  const handleCreateTargetedOpportunity = async (e) => {
    e.preventDefault();
    setCreatingOpportunity(true);
    try {
      await api.createOpportunity({ title: opportunityTitle, description: opportunityDesc, learnerId: selectedLearnerForOffer?.id }, token);
      setOpportunityTitle('');
      setOpportunityDesc('');
      setSelectedLearnerForOffer(null);
      showToast('Targeted opportunity created', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create targeted opportunity', 'error');
    } finally {
      setCreatingOpportunity(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading mentors...</p>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h1>Find a Mentor</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '1.125rem' }}>
            Connect with experienced mentors who can guide your learning journey
          </p>
        </div>

        {user.role === 'mentor' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <h3>Create Opportunity / Offer</h3>
              {selectedLearnerForOffer ? (
                <form onSubmit={handleCreateTargetedOpportunity}>
                  <div className="form-group">
                    <label className="form-label">Targeted Learner</label>
                    <div className="card-text">{selectedLearnerForOffer.name} ({selectedLearnerForOffer.email})</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={opportunityTitle} onChange={(e) => setOpportunityTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" value={opportunityDesc} onChange={(e) => setOpportunityDesc(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => { setSelectedLearnerForOffer(null); setOpportunityTitle(''); setOpportunityDesc(''); }} disabled={creatingOpportunity}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={creatingOpportunity}>{creatingOpportunity ? 'Creating...' : 'Create Targeted Offer'}</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateOpportunity}>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={opportunityTitle} onChange={(e) => setOpportunityTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" value={opportunityDesc} onChange={(e) => setOpportunityDesc(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={creatingOpportunity}>{creatingOpportunity ? 'Creating...' : 'Create Offer'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {user.role === 'mentor' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="card">
              <h3>Top Learners</h3>
              {topLearners.length === 0 ? (
                <p>No learners available yet</p>
              ) : (
                <div className="grid grid-2">
                  {topLearners.map(l => (
                    <div key={l.id} style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{l.name}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-lighter)' }}>{l.email}</div>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                          <div className="badge">{l.progress}%</div>
                        </div>
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleOfferToLearner(l)}>Send Offer</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {mentors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3 className="empty-state-title">No mentors available yet</h3>
            <p>Check back soon to connect with mentors</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {mentors.map(mentor => (
              <div key={mentor.id} className="card">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
                <h3 className="card-title">{mentor.name}</h3>
                <p className="card-text" style={{ marginBottom: '1rem' }}>{mentor.email}</p>
                <button
                  onClick={() => setSelectedMentor(mentor)}
                  className="btn btn-primary btn-sm"
                >
                  Request Mentorship
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedMentor && (
          <div className="modal-overlay" onClick={() => setSelectedMentor(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Request Mentorship</h3>
                <p style={{ color: 'var(--text-light)' }}>
                  Send a mentorship request to {selectedMentor.name}
                </p>
              </div>

              <form onSubmit={handleRequestMentor}>
                <div className="form-group">
                  <label htmlFor="topic" className="form-label">What do you want to learn?</label>
                  <textarea
                    id="topic"
                    className="form-textarea"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="E.g., I want to learn web development and build my first website..."
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="btn btn-ghost"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Mentors;