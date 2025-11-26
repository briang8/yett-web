const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // Auth
  register: async (data) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  // Modules
  getModules: async () => {
    const response = await fetch(`${API_URL}/modules`);
    if (!response.ok) throw new Error('Failed to fetch modules');
    return response.json();
  },

  getModule: async (id) => {
    const response = await fetch(`${API_URL}/modules/${id}`);
    if (!response.ok) throw new Error('Failed to fetch module');
    return response.json();
  },

  completeModule: async (moduleId, token) => {
    const response = await fetch(`${API_URL}/modules/${moduleId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to complete module');
    return response.json();
  },

  // Quiz
  getQuiz: async (moduleId, token) => {
    const response = await fetch(`${API_URL}/modules/${moduleId}/quiz`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch quiz');
    return response.json();
  },

  submitQuiz: async (moduleId, answers, token) => {
    const response = await fetch(`${API_URL}/modules/${moduleId}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ answers })
    });
    if (!response.ok) throw new Error('Failed to submit quiz');
    return response.json();
  },

  // Mentors
  getMentors: async () => {
    const response = await fetch(`${API_URL}/mentors`);
    if (!response.ok) throw new Error('Failed to fetch mentors');
    return response.json();
  },

  // Opportunities / Offers
  createOpportunity: async (data, token) => {
    const response = await fetch(`${API_URL}/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create opportunity');
    }
    return response.json();
  },

  getOpportunities: async (token) => {
    const response = await fetch(`${API_URL}/opportunities`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch opportunities');
    return response.json();
  },

  respondOpportunity: async (id, status, token) => {
    const response = await fetch(`${API_URL}/opportunities/${id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to respond to opportunity');
    }
    return response.json();
  },

  getMatches: async (token) => {
    const response = await fetch(`${API_URL}/matches`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch matches');
    return response.json();
  },

  getTopLearners: async (token) => {
    const response = await fetch(`${API_URL}/mentors/top-learners`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch top learners');
    return response.json();
  },

  // Admin recommendations
  recommendLearner: async (learnerId, mentorId, message, token) => {
    const response = await fetch(`${API_URL}/admin/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ learnerId, mentorId, message })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to recommend learner');
    }
    return response.json();
  },

  getRecommendations: async (token) => {
    const response = await fetch(`${API_URL}/admin/recommendations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch recommendations');
    return response.json();
  },

  // Mentorship
  createMentorshipRequest: async (data, token) => {
    const response = await fetch(`${API_URL}/mentorship/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create mentorship request');
    return response.json();
  },

  getMentorshipRequests: async (token) => {
    const response = await fetch(`${API_URL}/mentorship/requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch mentorship requests');
    return response.json();
  },

  updateMentorshipRequest: async (requestId, status, token) => {
    const response = await fetch(`${API_URL}/mentorship/requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update mentorship request');
    return response.json();
  },

  // Users
  getUser: async (userId, token) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  resetProgress: async (userId, token) => {
    const response = await fetch(`${API_URL}/users/${userId}/reset-progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to reset progress');
    return response.json();
  },

  // Admin
  getAdminUsers: async (token) => {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  createModule: async (data, token) => {
    const response = await fetch(`${API_URL}/admin/modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create module');
    return response.json();
  },

  deleteModule: async (moduleId, token) => {
    const response = await fetch(`${API_URL}/admin/modules/${moduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete module');
    return response.json();
  }
};