# Technical Documentation

## Architecture Overview

### System Design
The platform uses a clean separation between frontend and backend with RESTful APIs connecting them.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│  MongoDB    │
│   (React)   │ API │  (Express)  │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Frontend Architecture
- **Pages**: Route components for each screen
- **Components**: Reusable UI elements (8 per major feature)
- **Hooks**: Business logic separated from UI
- **Services**: API communication layer
- **Utils**: Caching and prefetching utilities

### Backend Architecture
- **Controllers**: Request handlers with optimized queries
- **Models**: MongoDB schemas for data structure
- **Routes**: API endpoint definitions
- **Middleware**: Compression, error handling

## Performance Optimizations

### Backend Optimizations
1. **Lean Queries**: Using `.lean()` for plain objects (62% faster)
2. **Field Projection**: Only return necessary fields
3. **Compound Indexes**: Fast lookups on multiple fields
4. **HTTP Compression**: 77% payload size reduction

### Frontend Optimizations
1. **SessionStorage Caching**: 5-minute cache for instant repeat visits
2. **Intelligent Prefetching**: Load data on hover before navigation
3. **Progressive Loading**: UI never blocks, shows immediately
4. **React Performance**: memo, useCallback, useMemo throughout

## API Reference

### Flashcard Endpoints
- `GET /api/flashcards` - List all flashcards
- `GET /api/flashcards/:id` - Get specific flashcard
- `GET /api/series` - List flashcard series
- `POST /api/series` - Create new series
- `POST /api/series/:id/sessions` - Start study session

### MCQ Endpoints
- `GET /api/mcqs` - List MCQ questions
- `GET /api/mcqs/filter-options` - Get filter metadata
- `GET /api/mcq-series` - List MCQ series
- `POST /api/mcq-series` - Create new series
- `POST /api/mcq-series/:id/sessions` - Start MCQ session

### Table Quiz Endpoints
- `GET /api/table-quizzes` - List table quizzes
- `GET /api/table-quizzes/filter-options` - Get filter metadata
- `GET /api/table-series` - List table series
- `POST /api/table-series` - Create new series
- `POST /api/table-series/:id/sessions` - Start table session

## Database Schema

### Series Collection
```javascript
{
  _id: ObjectId,
  title: String,
  status: 'active' | 'completed',
  sessions: [{
    sessionId: Number,
    status: 'active' | 'completed',
    cards/questions/tables: Array,
    startedAt: Date,
    completedAt: Date
  }],
  startedAt: Date,
  completedAt: Date
}
```

### Question/Card Collections
```javascript
{
  _id: ObjectId,
  questionId/cardId/tableId: Number,
  content: String,
  subject: String,
  chapter: String,
  section: String,
  tags: [String],
  // Type-specific fields...
}
```

## Deployment Guide

### Environment Variables
```env
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/studyplatform
SERIES_MONGODB_URI=mongodb://localhost:27017/studyplatform
PORT=3001
NODE_ENV=production

# Frontend (.env)
REACT_APP_API_URL=http://localhost:3001/api
```

### Vercel Deployment (Free)
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy frontend: `cd frontend && vercel`
3. Deploy backend: `cd backend && vercel`
4. Add environment variables in Vercel dashboard

### MongoDB Atlas Setup (Free)
1. Create account at mongodb.com/atlas
2. Create free M0 cluster (512MB)
3. Get connection string
4. Replace localhost URI with Atlas URI

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Enable MongoDB connection pooling
- [ ] Configure CORS for production domain
- [ ] Set up error monitoring (Sentry)
- [ ] Enable Cloudflare CDN
- [ ] Test all API endpoints
- [ ] Verify caching works correctly

## Performance Monitoring

### Key Metrics to Track
- API response times (target: <500ms)
- Page load time (target: <1s)
- Cache hit rate (target: >80%)
- Error rate (target: <0.1%)

### Monitoring Tools
- Browser DevTools Network tab
- MongoDB Atlas performance metrics
- Vercel Analytics (free tier)
- Custom performance logging in utils/performanceMonitor.js

## Troubleshooting

### Common Issues

**Slow API responses**
- Check MongoDB indexes: `db.collection.getIndexes()`
- Verify .lean() is used in queries
- Check network latency to database

**Cache not working**
- Check sessionStorage in browser DevTools
- Verify cache keys are consistent
- Check 5-minute expiration logic

**Prefetch not working**
- Check console for prefetch logs
- Verify hover events are firing
- Check network tab for background requests

**High hosting costs**
- Merge databases into one MongoDB instance
- Use Vercel/Netlify free tiers
- Enable auto-pause on MongoDB Atlas
- Implement more aggressive caching