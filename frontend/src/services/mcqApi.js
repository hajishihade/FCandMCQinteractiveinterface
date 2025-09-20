import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// MCQ API Service - Completely separate from flashcard API
class MCQApiService {

  // MCQ Question Management
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

  static async getById(questionId) {
    const response = await axios.get(`${API_BASE}/mcqs/${questionId}`);
    return response.data;
  }

  static async getByIds(questionIds) {
    const response = await axios.post(`${API_BASE}/mcqs/batch`, { questionIds });
    return response.data;
  }

  static async getFilterOptions() {
    const response = await axios.get(`${API_BASE}/mcqs/filter-options`);
    return response; // Return full response to match other methods
  }

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