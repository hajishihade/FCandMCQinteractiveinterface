import initialData from '../data/mockTableData.json';

// Create mutable copy for persistence during session
let mockData = JSON.parse(JSON.stringify(initialData));

// Save to localStorage for persistence across refreshes
const STORAGE_KEY = 'tableQuizMockData';

// Load from localStorage if available
const savedData = localStorage.getItem(STORAGE_KEY);
if (savedData) {
  try {
    mockData = JSON.parse(savedData);
  } catch (e) {
    console.log('Using fresh mock data');
  }
}

// Save data to localStorage
const saveMockData = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
};

// Mock API Service for testing table quiz functionality without database
// This provides the exact same interface as the real API but uses JSON data

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class MockTableQuizApiService {
  static async getAll(params = {}) {
    await delay(300); // Simulate network delay

    const {
      limit = 50,
      skip = 0,
      search = '',
      subject = '',
      chapter = '',
      section = ''
    } = params;

    let tables = [...mockData.tableQuizzes];

    // Apply filters
    if (search) {
      tables = tables.filter(table =>
        table.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (subject) {
      tables = tables.filter(table => table.subject === subject);
    }
    if (chapter) {
      tables = tables.filter(table => table.chapter === chapter);
    }
    if (section) {
      tables = tables.filter(table => table.section === section);
    }

    // Apply pagination
    const start = parseInt(skip);
    const end = start + parseInt(limit);
    const paginatedTables = tables.slice(start, end);

    return {
      success: true,
      data: paginatedTables,
      pagination: {
        total: tables.length,
        skip: start,
        limit: parseInt(limit),
        hasNext: end < tables.length
      }
    };
  }

  static async getById(tableId) {
    await delay(200);

    const table = mockData.tableQuizzes.find(t => t.tableId === parseInt(tableId));

    if (!table) {
      throw new Error('Table quiz not found');
    }

    return {
      success: true,
      data: table
    };
  }

  static async getByIds(tableIds) {
    await delay(250);

    const tables = mockData.tableQuizzes.filter(table =>
      tableIds.includes(table.tableId)
    );

    if (tables.length !== tableIds.length) {
      const foundIds = tables.map(t => t.tableId);
      const missingIds = tableIds.filter(id => !foundIds.includes(id));
      throw new Error(`Some table quizzes not found: ${missingIds.join(', ')}`);
    }

    return {
      success: true,
      data: tables
    };
  }

  static async getFilterOptions() {
    await delay(100);

    return {
      success: true,
      data: mockData.filterOptions
    };
  }

  static async getStats() {
    await delay(150);

    return {
      success: true,
      data: {
        total: mockData.tableQuizzes.length,
        bySubject: [
          { _id: 'Psychology', count: 2 },
          { _id: 'Education', count: 1 },
          { _id: 'Computer Science', count: 1 }
        ],
        bySource: [
          { _id: 'Manual Entry', count: 4 }
        ]
      }
    };
  }
}

class MockTableSeriesApiService {
  static async getAll(params = {}) {
    await delay(200);

    const { limit = 10, skip = 0 } = params;

    const series = [...mockData.tableSeries];

    // Add calculated fields that would come from database
    const processedSeries = series.map(s => ({
      ...s,
      completedCount: s.sessions.filter(session => session.status === 'completed').length,
      activeSession: s.sessions.find(session => session.status === 'active') || null
    }));

    const start = parseInt(skip);
    const end = start + parseInt(limit);
    const paginatedSeries = processedSeries.slice(start, end);

    return {
      success: true,
      data: paginatedSeries,
      pagination: {
        total: series.length,
        skip: start,
        limit: parseInt(limit),
        hasNext: end < series.length
      }
    };
  }

  static async getById(seriesId) {
    await delay(150);

    const series = mockData.tableSeries.find(s => s._id === seriesId);

    if (!series) {
      throw new Error('Table series not found');
    }

    return {
      success: true,
      data: series
    };
  }

  static async create(title) {
    await delay(300);

    const newSeries = {
      _id: `series${Date.now()}`,
      title,
      status: 'active',
      sessions: [],
      startedAt: new Date().toISOString()
    };

    // In real app, this would save to database
    console.log('Mock: Created new table series:', newSeries);

    return {
      success: true,
      message: 'Table series created successfully',
      data: {
        seriesId: newSeries._id,
        title: newSeries.title,
        status: newSeries.status,
        startedAt: newSeries.startedAt
      }
    };
  }
}

class MockTableSessionApiService {
  static async start(seriesId, tableIds, generatedFrom = null) {
    await delay(400);

    const newSessionId = Math.floor(Math.random() * 1000) + 100;

    // FIXED: Actually add the session to mock data for persistence
    const series = mockData.tableSeries.find(s => s._id === seriesId);
    if (series) {
      const newSession = {
        sessionId: newSessionId,
        status: 'active',
        tables: tableIds.map(tableId => ({
          tableId,
          interaction: null
        })),
        startedAt: new Date().toISOString()
      };
      series.sessions.push(newSession);
      saveMockData(); // Persist to localStorage
    }

    console.log('Mock: Starting table session:', {
      seriesId,
      sessionId: newSessionId,
      tableIds,
      generatedFrom
    });

    return {
      success: true,
      message: 'Table session started successfully',
      data: {
        sessionId: newSessionId,
        tableCount: tableIds.length
      }
    };
  }

  static async recordInteraction(seriesId, sessionId, interaction) {
    await delay(300);

    // FIXED: Actually record the interaction in mock data
    const series = mockData.tableSeries.find(s => s._id === seriesId);
    if (series) {
      const session = series.sessions.find(s => s.sessionId === sessionId);
      if (session) {
        const table = session.tables.find(t => t.tableId === interaction.tableId);
        if (table) {
          table.interaction = {
            userGrid: interaction.userGrid,
            results: interaction.results,
            difficulty: interaction.difficulty,
            confidenceWhileSolving: interaction.confidenceWhileSolving,
            timeSpent: interaction.timeSpent
          };
        }
      }
    }

    saveMockData(); // Persist to localStorage

    console.log('Mock: Recording table interaction:', {
      seriesId,
      sessionId,
      tableId: interaction.tableId,
      accuracy: interaction.results.accuracy,
      timeSpent: interaction.timeSpent
    });

    return {
      success: true,
      message: 'Interaction recorded successfully',
      data: {
        accuracy: interaction.results.accuracy,
        correctPlacements: interaction.results.correctPlacements,
        totalCells: interaction.results.totalCells
      }
    };
  }

  static async complete(seriesId, sessionId) {
    await delay(200);

    // FIXED: Actually mark session as completed in mock data
    const series = mockData.tableSeries.find(s => s._id === seriesId);
    if (series) {
      const session = series.sessions.find(s => s.sessionId === sessionId);
      if (session) {
        session.status = 'completed';
        session.completedAt = new Date().toISOString();
      }
    }

    saveMockData(); // Persist to localStorage

    console.log('Mock: Completing table session:', { seriesId, sessionId });

    return {
      success: true,
      message: 'Session completed successfully'
    };
  }

  static async delete(seriesId, sessionId) {
    await delay(250);

    console.log('Mock: Deleting table session:', { seriesId, sessionId });

    return {
      success: true,
      message: 'Session deleted successfully',
      data: {
        seriesId,
        deletedSessionId: sessionId,
        remainingSessions: 1,
        seriesDeleted: false
      }
    };
  }
}

// Export with same interface as real API
export const tableQuizAPI = MockTableQuizApiService;
export const tableSeriesAPI = MockTableSeriesApiService;
export const tableSessionAPI = MockTableSessionApiService;

const mockTableQuizApiDefault = {
  tableQuiz: MockTableQuizApiService,
  series: MockTableSeriesApiService,
  session: MockTableSessionApiService
};

export default mockTableQuizApiDefault;