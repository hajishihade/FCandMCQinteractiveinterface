// Session Persistence Utilities - Safe localStorage wrapper

const SESSION_STORAGE_KEY = 'study-session-state';

export const sessionPersistence = {
  // Save current session state to localStorage
  saveSession: (sessionData) => {
    try {
      if (typeof Storage !== 'undefined') {
        const dataToSave = {
          ...sessionData,
          timestamp: Date.now(),
          version: '1.0' // For future compatibility
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
      // Fail silently - don't break the app if localStorage is unavailable
    }
  },

  // Load session state from localStorage
  loadSession: () => {
    try {
      if (typeof Storage !== 'undefined') {
        const savedData = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Check if data is recent (within 24 hours)
          const isRecent = (Date.now() - parsedData.timestamp) < (24 * 60 * 60 * 1000);

          if (isRecent && parsedData.version === '1.0') {
            return parsedData;
          } else {
            // Remove stale data
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load session from localStorage:', error);
      // Fail silently - don't break the app if localStorage is corrupted
    }
    return null;
  },

  // Clear saved session data
  clearSession: () => {
    try {
      if (typeof Storage !== 'undefined') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
      // Fail silently
    }
  },

  // Check if there's a saved session available
  hasSavedSession: () => {
    try {
      if (typeof Storage !== 'undefined') {
        const savedData = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          const isRecent = (Date.now() - parsedData.timestamp) < (24 * 60 * 60 * 1000);
          return isRecent && parsedData.version === '1.0';
        }
      }
    } catch (error) {
      // Fail silently
    }
    return false;
  }
};