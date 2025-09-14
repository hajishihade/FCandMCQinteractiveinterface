# Flashcard Studying App - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [API Documentation](#api-documentation)
5. [Component Documentation](#component-documentation)
6. [Database Schema](#database-schema)
7. [Deployment Guide](#deployment-guide)

## Project Overview

A modern flashcard studying application with spaced repetition, built with React and Node.js. Features a minimal purple gradient design with smart filtering and session-based learning.

### Tech Stack
- **Frontend**: React.js, React Router, React Select
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Styling**: CSS3 with animations

## Architecture

```
flashcardstudyingapp/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   └── middleware/     # Custom middleware
│   └── config/             # Configuration files
└── frontend/               # React application
    └── src/
        ├── components/     # Reusable components
        ├── pages/         # Page components
        └── services/      # API services
```

## Features

### 1. Series Management
- Create flashcard series with custom titles
- Track progress across multiple study sessions
- Session-based learning system (up to 8 sessions per series)

### 2. Smart Filtering
- **Cascading Filters**: Subject → Chapter → Section
- **Independent Tags**: Filter by tags regardless of hierarchy
- **Searchable Multi-Select**: Type to search within dropdowns
- **Dynamic Options**: Options update based on parent selections

### 3. Study Sessions
- Interactive flashcard interface
- Track time spent per card
- Record confidence levels (High/Low)
- Mark cards as Right/Wrong
- Progress tracking with statistics

### 4. Visual Design
- Minimal purple gradient theme
- Illumination effects (glow, pulse animations)
- Clean, underline-only inputs
- Responsive design for all devices

## API Documentation

### Base URL
```
http://localhost:5001/api
```

### Endpoints

#### Flashcards
```javascript
GET    /flashcards          // Get all flashcards with filters
POST   /flashcards          // Create new flashcard
GET    /flashcards/:id      // Get single flashcard
PUT    /flashcards/:id      // Update flashcard
DELETE /flashcards/:id      // Delete flashcard
```

**Query Parameters for GET /flashcards:**
- `subjects`: Comma-separated list of subjects
- `chapters`: Comma-separated list of chapters
- `sections`: Comma-separated list of sections
- `tags`: Comma-separated list of tags
- `search`: Search term for question/answer
- `limit`: Number of results (default: 1000)

#### Series
```javascript
GET    /series              // Get all series
POST   /series              // Create new series
GET    /series/:id          // Get single series
PUT    /series/:id          // Update series
DELETE /series/:id          // Delete series

// Session endpoints
POST   /series/:id/sessions/:sessionId/start     // Start session
PUT    /series/:id/sessions/:sessionId/card      // Update card interaction
POST   /series/:id/sessions/:sessionId/complete  // Complete session
DELETE /series/:id/sessions/:sessionId           // Delete session
```

## Component Documentation

### Pages

#### Dashboard (`/`)
Entry point with two main actions:
- Create new series
- Browse existing series

#### CreateSeries (`/create-series`)
Features:
- Multi-select searchable filters
- Cascading filter logic
- Flashcard selection grid
- Series title input with illumination effect

#### BrowseSeries (`/browse-series`)
Features:
- List view of all series
- Session squares showing progress
- Create custom sessions
- Edit active sessions

#### StudySession (`/study`)
Features:
- Flashcard flip animation
- Time tracking
- Confidence selection
- Right/Wrong marking
- Progress bar

### Components

#### SessionRecipeModal
Modal for creating/editing custom sessions:
- Flashcard selection
- Search functionality
- Session configuration

## Database Schema

### Flashcard Schema
```javascript
{
  question: String,
  answer: String,
  subject: String,
  chapter: String,
  section: String,
  tags: [String],
  difficulty: String,
  source: String,
  created_at: Date,
  updated_at: Date
}
```

### Series Schema
```javascript
{
  title: String,
  sessions: [{
    sessionId: Number,
    status: 'active' | 'completed',
    cards: [{
      cardId: ObjectId,
      interaction: {
        result: 'Right' | 'Wrong',
        timeSpent: Number,
        confidence: 'High' | 'Low',
        timestamp: Date
      }
    }],
    startedAt: Date,
    completedAt: Date
  }],
  sessionCount: Number,
  completedSessions: Number,
  totalCards: Number,
  status: 'active' | 'completed',
  startedAt: Date,
  completedAt: Date
}
```

## Deployment Guide

### Prerequisites
- Node.js v14+
- MongoDB instance
- npm or yarn

### Environment Variables

Backend `.env`:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=5001
```

### Installation Steps

1. **Clone repository**
```bash
git clone https://github.com/hajishihade/flashcardstudyingapp.git
cd flashcardstudyingapp
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Start development servers**

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

### Production Build

Frontend:
```bash
cd frontend
npm run build
```

The build folder can be served with any static hosting service.

### MongoDB Setup

1. Create a MongoDB Atlas account or set up local MongoDB
2. Create a database named `flashcardstudyingapp`
3. Collections will be created automatically:
   - `flashcards`
   - `series`

## Key Features Implementation

### Cascading Filters
The filter system implements a hierarchical structure:
```javascript
// When subject changes, filter available chapters
const availableChapters = flashcards
  .filter(card => selectedSubjects.includes(card.subject))
  .map(card => card.chapter);

// When chapter changes, filter available sections
const availableSections = flashcards
  .filter(card => selectedChapters.includes(card.chapter))
  .map(card => card.section);
```

### Session Management
- Only one active session per series allowed
- Sessions track individual card interactions
- Statistics calculated from interaction data

### Illumination Effects
CSS animations guide user attention:
```css
@keyframes glow {
  0%, 100% {
    border-bottom-color: rgba(255,255,255,0.5);
    text-shadow: 0 0 10px rgba(255,255,255,0.5);
  }
  50% {
    border-bottom-color: rgba(255,255,255,0.8);
    text-shadow: 0 0 20px rgba(255,255,255,0.8);
  }
}
```

## Future Enhancements

### MCQ Support
The architecture supports adding MCQ functionality:
- New MCQ model with question/options structure
- Series type field to distinguish content types
- Reuse existing session management
- Minimal UI changes needed (2-3 hours implementation)

### Additional Features
- Export study statistics
- Spaced repetition algorithm
- User authentication
- Cloud sync
- Mobile app

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - See LICENSE file for details