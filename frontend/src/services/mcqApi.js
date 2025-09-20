/**
 * MCQ API Service Module
 *
 * Provides API communication layer for MCQ-related features.
 * Handles all HTTP requests to the backend MCQ endpoints.
 *
 * Architecture:
 * - Three separate service classes for MCQ, Series, and Sessions
 * - Static methods for easy import and use
 * - Consistent error handling via axios
 * - Query parameter building for complex filters
 *
 * Performance considerations:
 * - Returns full response object for filter options (caching compatibility)
 * - Supports batch operations for efficiency
 * - Parameterized queries prevent SQL injection
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * MCQ Question API Service
 *
 * Handles CRUD operations for MCQ questions with advanced filtering
 */
class MCQApiService {

  /**
   * Fetch MCQ questions with filtering and pagination
   *
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of questions to fetch (default: 50)
   * @param {number} params.skip - Number to skip for pagination
   * @param {string} params.search - Full-text search term
   * @param {string} params.subject - Filter by subject
   * @param {string} params.chapter - Filter by chapter
   * @param {string} params.section - Filter by section
   * @param {string} params.tags - Comma-separated tags
   * @param {string} params.source - Filter by source
   * @returns {Promise<Object>} Response with questions and pagination data
   */
  static async getAll(params = {}) {
    const {
      limit = 50,
      skip = 0,
      search = '',
      subject = '',
      chapter = '',
      section = '',
      tags = '',
      source = ''
    } = params;

    // Build query string, omitting empty parameters
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
      ...(search && { search }),
      ...(subject && { subject }),
      ...(chapter && { chapter }),
      ...(section && { section }),
      ...(tags && { tags }),
      ...(source && { source })
    });

    const response = await axios.get(`${API_BASE}/mcqs?${queryParams}`);
    return response.data;
  }

  /**
   * Fetch single MCQ by ID
   * @param {number} questionId - MCQ question ID
   * @returns {Promise<Object>} MCQ question data
   */
  static async getById(questionId) {
    const response = await axios.get(`${API_BASE}/mcqs/${questionId}`);
    return response.data;
  }

  /**
   * Fetch multiple MCQs by IDs (batch operation)
   * @param {Array<number>} questionIds - Array of question IDs
   * @returns {Promise<Object>} Array of MCQ questions
   */
  static async getByIds(questionIds) {
    const response = await axios.post(`${API_BASE}/mcqs/batch`, { questionIds });
    return response.data;
  }

  /**
   * Fetch all available filter options from database
   * Used to populate filter dropdowns with all possible values
   * @returns {Promise<Object>} Full response object for caching
   */
  static async getFilterOptions() {
    const response = await axios.get(`${API_BASE}/mcqs/filter-options`);
    return response; // Returns full response for caching compatibility
  }

  /**
   * Fetch MCQ statistics
   * @returns {Promise<Object>} Statistics about MCQ usage
   */
  static async getStats() {
    const response = await axios.get(`${API_BASE}/mcqs/stats`);
    return response.data;
  }
}

// MCQ Series API Service
class MCQSeriesApiService {

  static async getAll(params = {}) {
    const { limit = 10, skip = 0 } = params;

    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString()
    });

    const response = await axios.get(`${API_BASE}/mcq-series?${queryParams}`);
    return response.data;
  }

  static async getById(seriesId) {
    const response = await axios.get(`${API_BASE}/mcq-series/${seriesId}`);
    return response.data;
  }

  static async create(title) {
    const response = await axios.post(`${API_BASE}/mcq-series`, { title });
    return response.data;
  }

  static async complete(seriesId) {
    const response = await axios.put(`${API_BASE}/mcq-series/${seriesId}/complete`);
    return response.data;
  }

  static async delete(seriesId) {
    const response = await axios.delete(`${API_BASE}/mcq-series/${seriesId}`);
    return response.data;
  }
}

// MCQ Session API Service
class MCQSessionApiService {

  static async start(seriesId, questionIds, generatedFrom = null) {
    // Ensure questionIds is an array
    if (!Array.isArray(questionIds)) {
      throw new Error('questionIds must be an array');
    }

    const response = await axios.post(`${API_BASE}/mcq-series/${seriesId}/sessions`, {
      questionIds: questionIds,
      generatedFrom: generatedFrom
    });
    return response.data;
  }

  static async recordInteraction(seriesId, sessionId, interaction) {
    const {
      questionId,
      selectedAnswer,
      correctAnswer,
      difficulty,
      confidenceWhileSolving,
      timeSpent
    } = interaction;

    const response = await axios.post(
      `${API_BASE}/mcq-series/${seriesId}/sessions/${sessionId}/interactions`,
      {
        questionId,
        selectedAnswer,
        correctAnswer,
        difficulty,
        confidenceWhileSolving,
        timeSpent
      }
    );
    return response.data;
  }

  static async complete(seriesId, sessionId) {
    const response = await axios.put(
      `${API_BASE}/mcq-series/${seriesId}/sessions/${sessionId}/complete`
    );
    return response.data;
  }

  static async delete(seriesId, sessionId) {
    const response = await axios.delete(
      `${API_BASE}/mcq-series/${seriesId}/sessions/${sessionId}`
    );
    return response.data;
  }
}

// Combined export object (similar to flashcard API structure)
export const mcqAPI = MCQApiService;
export const mcqSeriesAPI = MCQSeriesApiService;
export const mcqSessionAPI = MCQSessionApiService;

// Default export with all services
const mcqApiDefault = {
  mcq: MCQApiService,
  series: MCQSeriesApiService,
  session: MCQSessionApiService
};

export default mcqApiDefault;