import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flashcards API
export const flashcardAPI = {
  getAll: (params = {}) => api.get('/flashcards', { params }),
  getById: (cardId) => api.get(`/flashcards/${cardId}`),
  getByIds: (cardIds) => api.post('/flashcards/batch', { cardIds }),
};

// Series API
export const seriesAPI = {
  getAll: (params = {}) => api.get('/series', { params }),
  getById: (seriesId) => api.get(`/series/${seriesId}`),
  create: (title) => api.post('/series', { title }),
  complete: (seriesId) => api.put(`/series/${seriesId}/complete`),
};

// Session API
export const sessionAPI = {
  start: (seriesId, cardIds, lastSessionId = null) =>
    api.post(`/series/${seriesId}/sessions`, { cardIds, lastSessionId }),

  recordInteraction: (seriesId, sessionId, interaction) =>
    api.post(`/series/${seriesId}/sessions/${sessionId}/interactions`, interaction),

  complete: (seriesId, sessionId) =>
    api.put(`/series/${seriesId}/sessions/${sessionId}/complete`),

  delete: (seriesId, sessionId) =>
    api.delete(`/series/${seriesId}/sessions/${sessionId}`),
};

export default api;