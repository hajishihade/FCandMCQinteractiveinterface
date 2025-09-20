/**
 * API Service Layer
 *
 * Centralized API client for flashcard and series endpoints.
 * Provides consistent interface for all backend communication.
 *
 * Features:
 * - Axios instance with default configuration
 * - Timeout handling (10 seconds)
 * - RESTful endpoint methods
 * - Batch operations support
 *
 * ⚠️ IMPROVEMENT NEEDED: Use environment variable for API_BASE_URL
 */

import axios from 'axios';

// ⚠️ IMPROVEMENT: Should use process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Configured axios instance
 * @constant {AxiosInstance}
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Flashcard API endpoints
 * @namespace flashcardAPI
 */
export const flashcardAPI = {
  getAll: (params = {}) => api.get('/flashcards', { params }),
  getById: (cardId) => api.get(`/flashcards/${cardId}`),
  getByIds: (cardIds) => api.post('/flashcards/batch', { cardIds }),
};

/**
 * Series API endpoints
 * @namespace seriesAPI
 */
export const seriesAPI = {
  getAll: (params = {}) => api.get('/series', { params }),
  getById: (seriesId) => api.get(`/series/${seriesId}`),
  create: (title) => api.post('/series', { title }),
  complete: (seriesId) => api.put(`/series/${seriesId}/complete`),
};

/**
 * Session API endpoints
 * @namespace sessionAPI
 */
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