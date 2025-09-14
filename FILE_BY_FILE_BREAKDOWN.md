# 📁 Complete File-by-File Breakdown

## Backend Files - Detailed Analysis

---

### 🔧 **backend/src/server.js**
**Location**: Main backend folder
**Purpose**: The heart of the backend - starts and configures the server

```javascript
// Line-by-line explanation:

const express = require('express');
// Imports Express - a web framework that makes creating servers easy
// Think of it like importing a toolkit for building web servers

const cors = require('cors');
// CORS = Cross-Origin Resource Sharing
// Allows the frontend (running on port 3000) to talk to backend (port 5001)
// Without this, browser would block the communication for security

const mongoose = require('mongoose');
// Mongoose is a tool that makes working with MongoDB easier
// It's like a translator between JavaScript and MongoDB

const connectDB = require('../config/database');
// Imports our database connection function
// The '../' means "go up one folder level"

// Import route files
const flashcardRoutes = require('./routes/flashcards');
const seriesRoutes = require('./routes/series');

// Import error handling middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
// Creates an Express application instance
// 'app' is now our server that we can configure

// Connect to database
connectDB();
// Calls the function to connect to MongoDB
// This must happen before we start accepting requests

// Middleware setup
app.use(cors());
// Tells the server to accept requests from other domains

app.use(express.json());
// Tells Express to automatically parse JSON in request bodies
// Without this, req.body would be undefined

app.use(express.urlencoded({ extended: true }));
// Allows parsing of URL-encoded data (form submissions)

// Routes
app.use('/api/flashcards', flashcardRoutes);
// Any request to /api/flashcards/* will be handled by flashcardRoutes

app.use('/api/series', seriesRoutes);
// Any request to /api/series/* will be handled by seriesRoutes

// Error handling middleware (must be last)
app.use(errorHandler);
// Catches any errors that occur and sends proper error responses

// Start server
const PORT = process.env.PORT || 5001;
// Use environment variable PORT if it exists, otherwise use 5001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // This message appears in terminal when server starts successfully
});
```

---

### 🔧 **backend/config/database.js**
**Purpose**: Establishes connection to MongoDB database

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  // async means this function can use 'await' for promises

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      // Uses new MongoDB connection string parser

      useUnifiedTopology: true,
      // Uses new server discovery and monitoring engine
    });

    console.log('MongoDB connected successfully');
    // Success message in terminal

  } catch (error) {
    console.error('MongoDB connection error:', error);
    // If connection fails, show the error

    process.exit(1);
    // Exit the application with error code 1
  }
};

module.exports = connectDB;
// Makes this function available to other files
```

---

### 🔧 **backend/src/models/Flashcard.js**
**Purpose**: Defines the structure of a flashcard in the database

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Schema is a blueprint for documents in MongoDB

const flashcardSchema = new Schema({
  question: {
    type: String,
    required: true,  // This field must have a value
    trim: true,      // Removes whitespace from beginning/end
  },

  answer: {
    type: String,
    required: true,
    trim: true,
  },

  subject: {
    type: String,
    required: true,
    index: true,  // Creates an index for faster searching
  },

  chapter: {
    type: String,
    required: false,  // Optional field
  },

  section: {
    type: String,
    required: false,
  },

  tags: {
    type: [String],  // Array of strings
    default: [],     // Empty array if not provided
  },

  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],  // Only these values allowed
    default: 'Medium',
  },

  source: {
    type: String,  // Where the flashcard came from
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
flashcardSchema.index({ subject: 1, chapter: 1, section: 1 });
// Compound index for filtering by hierarchy

flashcardSchema.index({ tags: 1 });
// Index for tag searches

// Create and export the model
module.exports = mongoose.model('Flashcard', flashcardSchema);
// 'Flashcard' is the model name, MongoDB will create 'flashcards' collection
```

---

### 🔧 **backend/src/models/Series.js**
**Purpose**: Defines the structure of a study series

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-schema for card interactions
const interactionSchema = new Schema({
  result: {
    type: String,
    enum: ['Right', 'Wrong'],  // Only these two values allowed
    required: true,
  },

  timeSpent: {
    type: Number,  // Time in seconds
    required: true,
    min: 0,  // Can't be negative
  },

  confidence: {
    type: String,
    enum: ['High', 'Low'],
    required: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,  // Current time when created
  }
});

// Sub-schema for cards within a session
const sessionCardSchema = new Schema({
  cardId: {
    type: Schema.Types.ObjectId,  // Reference to a Flashcard
    ref: 'Flashcard',  // Tells Mongoose this refers to Flashcard model
    required: true,
  },

  interaction: {
    type: interactionSchema,  // Uses the schema defined above
    default: null,  // No interaction until user answers
  }
});

// Sub-schema for sessions
const sessionSchema = new Schema({
  sessionId: {
    type: Number,
    required: true,
    min: 1,  // Sessions start at 1
  },

  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },

  cards: [sessionCardSchema],  // Array of cards with interactions

  startedAt: {
    type: Date,
    default: Date.now,
  },

  completedAt: {
    type: Date,
    default: null,  // Only set when session is completed
  }
});

// Main series schema
const seriesSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,  // Maximum 100 characters
  },

  sessions: [sessionSchema],  // Array of sessions

  sessionCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 8,  // Maximum 8 sessions per series
  },

  completedSessions: {
    type: Number,
    default: 0,
  },

  totalCards: {
    type: Number,
    default: 0,
  },

  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },

  startedAt: {
    type: Date,
    default: Date.now,
  },

  completedAt: Date  // Optional, only when series is finished
}, {
  timestamps: true
});

// Instance method - can be called on a series document
seriesSchema.methods.getActiveSession = function() {
  return this.sessions.find(session => session.status === 'active');
  // Returns the first active session, or undefined if none
};

// Static method - can be called on the Series model itself
seriesSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
  // Returns all active series
};

module.exports = mongoose.model('Series', seriesSchema);
```

---

### 🔧 **backend/src/controllers/flashcardController.js**
**Purpose**: Contains the logic for handling flashcard-related requests

```javascript
const Flashcard = require('../models/Flashcard');

// GET all flashcards with optional filters
exports.getFlashcards = async (req, res) => {
  try {
    // Extract query parameters from URL
    // Example: /api/flashcards?subject=Math&chapter=Algebra
    const {
      subjects,  // Comma-separated list
      chapters,
      sections,
      tags,
      search,
      limit = 1000  // Default to 1000 if not specified
    } = req.query;

    // Build MongoDB query object
    const query = {};

    // Add filters if they exist
    if (subjects) {
      // Split comma-separated string into array
      const subjectList = subjects.split(',');
      query.subject = { $in: subjectList };
      // $in means "match any value in this array"
    }

    if (chapters) {
      const chapterList = chapters.split(',');
      query.chapter = { $in: chapterList };
    }

    if (sections) {
      const sectionList = sections.split(',');
      query.section = { $in: sectionList };
    }

    if (tags) {
      const tagList = tags.split(',');
      query.tags = { $in: tagList };
      // Will match if flashcard has any of these tags
    }

    if (search) {
      // Search in both question and answer
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        // $regex: regular expression search
        // $options: 'i' means case-insensitive
        { answer: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query
    const flashcards = await Flashcard
      .find(query)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });  // Newest first (-1 = descending)

    // Send response
    res.json({
      success: true,
      count: flashcards.length,
      data: flashcards
    });

  } catch (error) {
    // If anything goes wrong, send error response
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// CREATE a new flashcard
exports.createFlashcard = async (req, res) => {
  try {
    // req.body contains the data sent from frontend
    const flashcard = new Flashcard(req.body);
    // Creates new flashcard instance (not saved yet)

    await flashcard.save();
    // Saves to database

    res.status(201).json({
      // 201 = Created successfully
      success: true,
      data: flashcard
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      // Mongoose validation failed (e.g., required field missing)
      res.status(400).json({
        // 400 = Bad Request
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    } else {
      res.status(500).json({
        // 500 = Internal Server Error
        success: false,
        error: error.message
      });
    }
  }
};

// GET single flashcard by ID
exports.getFlashcard = async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    // req.params.id comes from the URL: /api/flashcards/:id

    if (!flashcard) {
      return res.status(404).json({
        // 404 = Not Found
        success: false,
        error: 'Flashcard not found'
      });
    }

    res.json({
      success: true,
      data: flashcard
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// UPDATE a flashcard
exports.updateFlashcard = async (req, res) => {
  try {
    const flashcard = await Flashcard.findByIdAndUpdate(
      req.params.id,  // Which flashcard to update
      req.body,       // New data
      {
        new: true,          // Return updated document
        runValidators: true // Check validation rules
      }
    );

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard not found'
      });
    }

    res.json({
      success: true,
      data: flashcard
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE a flashcard
exports.deleteFlashcard = async (req, res) => {
  try {
    const flashcard = await Flashcard.findByIdAndDelete(req.params.id);

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard not found'
      });
    }

    res.json({
      success: true,
      message: 'Flashcard deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

---

## Frontend Files - Detailed Analysis

---

### 🎨 **frontend/src/services/api.js**
**Purpose**: Central place for all API calls to the backend

```javascript
import axios from 'axios';
// Axios is a library for making HTTP requests
// It's like fetch() but with more features

const API_BASE = 'http://localhost:5001/api';
// Base URL for all API calls
// In production, this would be your server's URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
    // Tells server we're sending JSON data
  }
});

// Flashcard API functions
export const flashcardAPI = {
  // Get all flashcards
  getAll: async (params = {}) => {
    // params might include: subjects, chapters, sections, tags, search

    try {
      const response = await api.get('/flashcards', { params });
      // Axios automatically converts params object to query string
      // Example: { subject: 'Math' } becomes ?subject=Math

      return response;
      // Returns the full response object

    } catch (error) {
      console.error('Error fetching flashcards:', error);
      throw error;  // Re-throw so component can handle it
    }
  },

  // Get single flashcard
  getById: async (id) => {
    return api.get(`/flashcards/${id}`);
    // Template literal allows inserting id into string
  },

  // Create new flashcard
  create: async (data) => {
    return api.post('/flashcards', data);
    // POST request with data in body
  },

  // Update flashcard
  update: async (id, data) => {
    return api.put(`/flashcards/${id}`, data);
    // PUT request to update existing resource
  },

  // Delete flashcard
  delete: async (id) => {
    return api.delete(`/flashcards/${id}`);
    // DELETE request to remove resource
  }
};

// Series API functions
export const seriesAPI = {
  // Get all series
  getAll: async (params = {}) => {
    return api.get('/series', { params });
  },

  // Create new series
  create: async (data) => {
    // data should include: title, sessionCount, flashcardIds
    return api.post('/series', data);
  },

  // Get single series with populated flashcards
  getById: async (id) => {
    return api.get(`/series/${id}`);
  },

  // Delete series
  delete: async (id) => {
    return api.delete(`/series/${id}`);
  }
};

// Session API functions (sub-resource of series)
export const sessionAPI = {
  // Start a new session
  start: async (seriesId, cardIds, previousSessionId = null) => {
    return api.post(`/series/${seriesId}/sessions/start`, {
      cardIds,          // Array of flashcard IDs
      previousSessionId // For determining session number
    });
  },

  // Update card interaction (when user answers)
  updateCard: async (seriesId, sessionId, cardId, interaction) => {
    return api.put(
      `/series/${seriesId}/sessions/${sessionId}/card`,
      {
        cardId,
        interaction  // { result, timeSpent, confidence }
      }
    );
  },

  // Complete a session
  complete: async (seriesId, sessionId) => {
    return api.post(
      `/series/${seriesId}/sessions/${sessionId}/complete`
    );
  },

  // Delete a session
  delete: async (seriesId, sessionId) => {
    return api.delete(
      `/series/${seriesId}/sessions/${sessionId}`
    );
  }
};

// Request interceptor (runs before every request)
api.interceptors.request.use(
  (config) => {
    // Could add auth token here if needed
    // config.headers.Authorization = `Bearer ${token}`;

    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (runs after every response)
api.interceptors.response.use(
  (response) => {
    // Successful response
    return response;
  },
  (error) => {
    // Error response
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response from server');
    } else {
      // Something else went wrong
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);
```

---

### 🎨 **frontend/src/pages/CreateSeries.js** (Detailed)
**Purpose**: The most complex page - handles filtering and series creation

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { flashcardAPI, seriesAPI } from '../services/api';
import './CreateSeries.css';

const CreateSeries = () => {
  // ========== STATE MANAGEMENT ==========
  // React hooks for managing component state

  const [flashcards, setFlashcards] = useState([]);
  // Stores all flashcards fetched from backend

  const [filteredFlashcards, setFilteredFlashcards] = useState([]);
  // Stores flashcards after applying filters

  const [selectedCards, setSelectedCards] = useState([]);
  // Tracks which cards user has selected for the series

  const [seriesTitle, setSeriesTitle] = useState('');
  // The name user gives to their series

  const [loading, setLoading] = useState(true);
  // Shows loading spinner while fetching data

  const [error, setError] = useState(null);
  // Stores any error messages

  // Filter states
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Options for dropdowns (dynamically generated)
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [chapterOptions, setChapterOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  const navigate = useNavigate();
  // Hook for programmatic navigation

  // ========== INITIAL DATA FETCH ==========
  useEffect(() => {
    // Runs once when component mounts
    fetchFlashcards();
  }, []); // Empty array means run once

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const response = await flashcardAPI.getAll();
      const cards = response.data.data;

      setFlashcards(cards);
      setFilteredFlashcards(cards);

      // Generate initial options for dropdowns
      generateFilterOptions(cards);

    } catch (error) {
      console.error('Error fetching flashcards:', error);
      setError('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  // ========== GENERATE DROPDOWN OPTIONS ==========
  const generateFilterOptions = (cards) => {
    // Extract unique values for each field

    // Get unique subjects
    const subjects = [...new Set(cards.map(card => card.subject))]
      .filter(Boolean)  // Remove null/undefined
      .sort()           // Alphabetical order
      .map(subject => ({
        value: subject,
        label: subject  // What user sees in dropdown
      }));

    // Get all unique tags (cards can have multiple tags)
    const allTags = cards.flatMap(card => card.tags || []);
    // flatMap flattens array of arrays into single array

    const tags = [...new Set(allTags)]
      .filter(Boolean)
      .sort()
      .map(tag => ({
        value: tag,
        label: tag
      }));

    setSubjectOptions(subjects);
    setTagOptions(tags);  // Tags are always available

    // Chapters and sections will be generated based on selections
  };

  // ========== CASCADING FILTER LOGIC ==========
  const handleSubjectChange = (selected) => {
    // selected is array of { value, label } objects from React Select

    const selectedValues = selected ? selected.map(item => item.value) : [];
    setSelectedSubjects(selectedValues);

    // Reset dependent filters
    setSelectedChapters([]);
    setSelectedSections([]);

    if (selectedValues.length > 0) {
      // Generate chapter options based on selected subjects
      const availableChapters = flashcards
        .filter(card => selectedValues.includes(card.subject))
        .map(card => card.chapter)
        .filter(Boolean);  // Remove null/undefined

      const uniqueChapters = [...new Set(availableChapters)]
        .sort()
        .map(chapter => ({
          value: chapter,
          label: chapter
        }));

      setChapterOptions(uniqueChapters);
      setSectionOptions([]);  // Clear sections
    } else {
      // No subjects selected, clear all dependent options
      setChapterOptions([]);
      setSectionOptions([]);
    }

    // Apply filters after change
    applyFilters();
  };

  const handleChapterChange = (selected) => {
    const selectedValues = selected ? selected.map(item => item.value) : [];
    setSelectedChapters(selectedValues);

    // Reset sections
    setSelectedSections([]);

    if (selectedValues.length > 0) {
      // Generate section options based on selected chapters
      const availableSections = flashcards
        .filter(card =>
          selectedSubjects.includes(card.subject) &&
          selectedValues.includes(card.chapter)
        )
        .map(card => card.section)
        .filter(Boolean);

      const uniqueSections = [...new Set(availableSections)]
        .sort()
        .map(section => ({
          value: section,
          label: section
        }));

      setSectionOptions(uniqueSections);
    } else {
      setSectionOptions([]);
    }

    applyFilters();
  };

  // ========== APPLY ALL FILTERS ==========
  const applyFilters = useCallback(() => {
    let filtered = [...flashcards];  // Start with all cards

    // Apply subject filter
    if (selectedSubjects.length > 0) {
      filtered = filtered.filter(card =>
        selectedSubjects.includes(card.subject)
      );
    }

    // Apply chapter filter
    if (selectedChapters.length > 0) {
      filtered = filtered.filter(card =>
        selectedChapters.includes(card.chapter)
      );
    }

    // Apply section filter
    if (selectedSections.length > 0) {
      filtered = filtered.filter(card =>
        selectedSections.includes(card.section)
      );
    }

    // Apply tag filter (independent of hierarchy)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(card =>
        card.tags && card.tags.some(tag =>
          selectedTags.includes(tag)
        )
      );
      // Check if card has at least one selected tag
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(card =>
        card.question.toLowerCase().includes(searchLower) ||
        card.answer.toLowerCase().includes(searchLower)
      );
    }

    setFilteredFlashcards(filtered);

  }, [flashcards, selectedSubjects, selectedChapters,
      selectedSections, selectedTags, searchTerm]);
  // Dependencies - rerun when any of these change

  // ========== CARD SELECTION ==========
  const handleCardToggle = (cardId) => {
    if (selectedCards.includes(cardId)) {
      // Card is selected, remove it
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else {
      // Card not selected, add it
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCards.length === filteredFlashcards.length) {
      // All are selected, deselect all
      setSelectedCards([]);
    } else {
      // Select all visible cards
      const allIds = filteredFlashcards.map(card => card._id);
      setSelectedCards(allIds);
    }
  };

  // ========== CREATE SERIES ==========
  const handleCreateSeries = async () => {
    // Validation
    if (!seriesTitle.trim()) {
      setError('Please enter a series title');
      return;
    }

    if (selectedCards.length === 0) {
      setError('Please select at least one flashcard');
      return;
    }

    try {
      setLoading(true);

      // Create the series
      const response = await seriesAPI.create({
        title: seriesTitle,
        flashcardIds: selectedCards,
        sessionCount: Math.min(8, Math.ceil(selectedCards.length / 10))
        // Auto-calculate sessions: ~10 cards per session, max 8
      });

      // Navigate to browse page on success
      navigate('/browse-series');

    } catch (error) {
      console.error('Error creating series:', error);
      setError('Failed to create series');
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDER UI ==========
  return (
    <div className="create-series-container">
      {/* Back button */}
      <div className="create-series-header">
        <button
          onClick={() => navigate('/')}
          className="back-btn"
        >
          ←
        </button>
      </div>

      {/* Multi-select filters */}
      <div className="filters-section">
        <div className="multi-select-filters">
          {/* Subject dropdown */}
          <Select
            isMulti
            options={subjectOptions}
            value={subjectOptions.filter(opt =>
              selectedSubjects.includes(opt.value)
            )}
            onChange={handleSubjectChange}
            placeholder="Select subjects..."
            className="filter-select"
            classNamePrefix="select"
          />

          {/* Chapter dropdown (disabled if no subjects) */}
          <Select
            isMulti
            options={chapterOptions}
            value={chapterOptions.filter(opt =>
              selectedChapters.includes(opt.value)
            )}
            onChange={handleChapterChange}
            placeholder="Select chapters..."
            className="filter-select"
            isDisabled={selectedSubjects.length === 0}
          />

          {/* Section dropdown (disabled if no chapters) */}
          <Select
            isMulti
            options={sectionOptions}
            value={sectionOptions.filter(opt =>
              selectedSections.includes(opt.value)
            )}
            onChange={(selected) => {
              const values = selected ? selected.map(s => s.value) : [];
              setSelectedSections(values);
              applyFilters();
            }}
            placeholder="Select sections..."
            className="filter-select"
            isDisabled={selectedChapters.length === 0}
          />

          {/* Tags dropdown (always enabled) */}
          <Select
            isMulti
            options={tagOptions}
            value={tagOptions.filter(opt =>
              selectedTags.includes(opt.value)
            )}
            onChange={(selected) => {
              const values = selected ? selected.map(s => s.value) : [];
              setSelectedTags(values);
              applyFilters();
            }}
            placeholder="Select tags..."
            className="filter-select"
          />
        </div>
      </div>

      {/* Series creation line */}
      <div className="series-creation-line">
        <input
          type="text"
          value={seriesTitle}
          onChange={(e) => setSeriesTitle(e.target.value)}
          placeholder="Enter the name of the series you want to create here"
          className="series-title-line"
          maxLength={100}
        />

        <button
          onClick={handleCreateSeries}
          disabled={!seriesTitle || selectedCards.length === 0}
          className="start-btn-minimal"
        >
          Start
        </button>
      </div>

      {/* Filter summary */}
      <div className="filter-summary">
        <div className="filter-count">
          {filteredFlashcards.length} flashcards
          ({selectedCards.length} selected)
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            applyFilters();
          }}
          placeholder="Search flashcards..."
          className="search-line-small"
        />

        <button
          onClick={handleSelectAll}
          className="select-all-btn"
        >
          {selectedCards.length === filteredFlashcards.length
            ? 'Deselect All'
            : 'Select All'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Flashcards grid */}
      <div className="flashcards-grid">
        {loading ? (
          <div className="loading">Loading flashcards...</div>
        ) : filteredFlashcards.length === 0 ? (
          <div className="no-flashcards-message">
            No flashcards match your filters
          </div>
        ) : (
          filteredFlashcards.map(card => (
            <div
              key={card._id}
              className={`flashcard-item ${
                selectedCards.includes(card._id) ? 'selected' : ''
              }`}
              onClick={() => handleCardToggle(card._id)}
            >
              <div className="card-header">
                <input
                  type="checkbox"
                  checked={selectedCards.includes(card._id)}
                  onChange={() => {}}  // Handled by parent onClick
                  className="card-checkbox"
                />
              </div>

              <div className="card-content">
                <h3>{card.question}</h3>

                <div className="card-meta">
                  <span className="card-subject">{card.subject}</span>
                  {card.chapter && (
                    <span className="card-chapter">{card.chapter}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CreateSeries;
```

---

## How Everything Connects - The Complete Flow

### 1. **Application Startup**
```
1. User opens browser to localhost:3000
2. React app loads index.js
3. index.js renders App.js
4. App.js sets up routing
5. Dashboard component loads as homepage
```

### 2. **Creating a Series - Complete Flow**
```
1. User clicks "Create Series" button
2. Router navigates to /create-series
3. CreateSeries component mounts
4. useEffect triggers fetchFlashcards()
5. API call to backend: GET /api/flashcards
6. Backend controller queries MongoDB
7. Flashcards returned to frontend
8. Component generates filter options
9. User selects filters
10. Cascading logic updates available options
11. User selects flashcards
12. User enters series title
13. User clicks "Start"
14. API call: POST /api/series
15. Backend creates series in MongoDB
16. Success response returned
17. Frontend navigates to /browse-series
```

### 3. **Database Operations Flow**
```
Frontend Request → API Service → Backend Route → Controller → Model → MongoDB
MongoDB → Model → Controller → Response → API Service → Frontend Update
```

This documentation provides a complete understanding of every file and how they work together!