import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Table Quiz API Service - Following exact MCQ pattern
class TableQuizApiService {

  // Table Quiz Management
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

    const response = await axios.get(`${API_BASE}/table-quizzes?${queryParams}`);
    return response.data;
  }

  static async getById(tableId) {
    const response = await axios.get(`${API_BASE}/table-quizzes/${tableId}`);
    return response.data;
  }

  static async getByIds(tableIds) {
    const response = await axios.post(`${API_BASE}/table-quizzes/batch`, { tableIds });
    return response.data;
  }

  static async getFilterOptions() {
    const response = await axios.get(`${API_BASE}/table-quizzes/filter-options`);
    return response; // Return full response to match other methods
  }

  static async getStats() {
    const response = await axios.get(`${API_BASE}/table-quizzes/stats`);
    return response.data;
  }
}

// Table Series API Service
class TableSeriesApiService {

  static async getAll(params = {}) {
    const { limit = 10, skip = 0 } = params;

    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString()
    });

    const response = await axios.get(`${API_BASE}/table-series?${queryParams}`);
    return response.data;
  }

  static async getById(seriesId) {
    const response = await axios.get(`${API_BASE}/table-series/${seriesId}`);
    return response.data;
  }

  static async create(title) {
    const response = await axios.post(`${API_BASE}/table-series`, { title });
    return response.data;
  }

  static async complete(seriesId) {
    const response = await axios.put(`${API_BASE}/table-series/${seriesId}/complete`);
    return response.data;
  }

  static async delete(seriesId) {
    const response = await axios.delete(`${API_BASE}/table-series/${seriesId}`);
    return response.data;
  }
}

// Table Session API Service
class TableSessionApiService {

  static async start(seriesId, tableIds, generatedFrom = null) {
    // Ensure tableIds is an array
    if (!Array.isArray(tableIds)) {
      throw new Error('tableIds must be an array');
    }

    const response = await axios.post(`${API_BASE}/table-series/${seriesId}/sessions`, {
      tableIds: tableIds,
      generatedFrom: generatedFrom
    });
    return response.data;
  }

  static async recordInteraction(seriesId, sessionId, interaction) {
    const {
      tableId,
      userGrid,
      results,
      difficulty,
      confidenceWhileSolving,
      timeSpent
    } = interaction;

    const response = await axios.post(
      `${API_BASE}/table-series/${seriesId}/sessions/${sessionId}/interactions`,
      {
        tableId,
        userGrid,
        results,
        difficulty,
        confidenceWhileSolving,
        timeSpent
      }
    );
    return response.data;
  }

  static async complete(seriesId, sessionId) {
    const response = await axios.put(
      `${API_BASE}/table-series/${seriesId}/sessions/${sessionId}/complete`
    );
    return response.data;
  }

  static async delete(seriesId, sessionId) {
    const response = await axios.delete(
      `${API_BASE}/table-series/${seriesId}/sessions/${sessionId}`
    );
    return response.data;
  }
}

// Combined export object (following MCQ pattern)
export const tableQuizAPI = TableQuizApiService;
export const tableSeriesAPI = TableSeriesApiService;
export const tableSessionAPI = TableSessionApiService;

// Default export with all services
const tableQuizApiDefault = {
  tableQuiz: TableQuizApiService,
  series: TableSeriesApiService,
  session: TableSessionApiService
};

export default tableQuizApiDefault;