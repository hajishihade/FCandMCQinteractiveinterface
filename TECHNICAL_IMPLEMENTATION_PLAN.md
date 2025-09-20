# Technical Implementation Plan - Performance Optimization

## Phase 1: Backend Query Optimization (Immediate - 1 Hour)
**Impact: 3.2s → 0.5s API response time**

### 1.1 Add .lean() to All Database Queries

#### File: `/backend/src/controllers/mcqController.js`

**Line 38-41 - Current Code:**
```javascript
const mcqs = await MCQ.find(filter)
  .skip(parseInt(skip))
  .limit(parseInt(limit))
  .sort({ questionId: 1 });
```

**Replace With:**
```javascript
const mcqs = await MCQ.find(filter)
  .lean()  // ADD THIS
  .select('questionId question subject chapter section source tags') // ADD THIS
  .skip(parseInt(skip))
  .limit(parseInt(limit))
  .sort({ questionId: 1 });
```

**Line 70 - Current Code:**
```javascript
const mcq = await MCQ.findOne({ questionId: parseInt(questionId) });
```

**Replace With:**
```javascript
const mcq = await MCQ.findOne({ questionId: parseInt(questionId) }).lean();
```

**Line 119-124 (getFilterOptions method) - Current Code:**
```javascript
const [subjects, chapters, sections, sources, tags] = await Promise.all([
  MCQ.distinct('subject'),
  MCQ.distinct('chapter'),
  MCQ.distinct('section'),
  MCQ.distinct('source'),
  MCQ.distinct('tags')
]);
```

**Replace With:**
```javascript
// Use aggregation for better performance
const filterData = await MCQ.aggregate([
  {
    $facet: {
      subjects: [{ $group: { _id: "$subject" } }, { $sort: { _id: 1 } }],
      chapters: [{ $group: { _id: "$chapter" } }, { $sort: { _id: 1 } }],
      sections: [{ $group: { _id: "$section" } }, { $sort: { _id: 1 } }],
      sources: [{ $group: { _id: "$source" } }, { $sort: { _id: 1 } }],
      tags: [{ $unwind: "$tags" }, { $group: { _id: "$tags" } }, { $sort: { _id: 1 } }]
    }
  }
]).allowDiskUse(true);

const subjects = filterData[0].subjects.map(s => s._id).filter(Boolean);
const chapters = filterData[0].chapters.map(c => c._id).filter(Boolean);
const sections = filterData[0].sections.map(s => s._id).filter(Boolean);
const sources = filterData[0].sources.map(s => s._id).filter(Boolean);
const tags = filterData[0].tags.map(t => t._id).filter(Boolean);
```

#### File: `/backend/src/controllers/mcqSeriesController.js`

**Line 10-13 - Current Code:**
```javascript
const series = await MCQSeriesNew.find()
  .sort({ updatedAt: -1 })
  .skip(parseInt(skip))
  .limit(parseInt(limit));
```

**Replace With:**
```javascript
const series = await MCQSeriesNew.find()
  .lean()  // ADD THIS
  .select('title status sessions startedAt updatedAt') // ADD THIS
  .sort({ updatedAt: -1 })
  .skip(parseInt(skip))
  .limit(parseInt(limit));
```

**Line 42 - Current Code:**
```javascript
const series = await MCQSeriesNew.findById(seriesId);
```

**Replace With:**
```javascript
const series = await MCQSeriesNew.findById(seriesId).lean();
```

#### File: `/backend/src/controllers/tableQuizController.js`

**Apply same .lean() pattern to all queries**

### 1.2 Combine Count and Find Queries

#### File: `/backend/src/controllers/mcqController.js`

**Line 38-43 - Current Code:**
```javascript
const mcqs = await MCQ.find(filter)
  .skip(parseInt(skip))
  .limit(parseInt(limit))
  .sort({ questionId: 1 });

const total = await MCQ.countDocuments(filter);
```

**Replace With:**
```javascript
// Single aggregation query instead of two
const result = await MCQ.aggregate([
  { $match: filter },
  {
    $facet: {
      data: [
        { $sort: { questionId: 1 } },
        { $skip: parseInt(skip) },
        { $limit: parseInt(limit) },
        {
          $project: {
            questionId: 1,
            question: 1,
            subject: 1,
            chapter: 1,
            section: 1,
            source: 1,
            tags: 1
          }
        }
      ],
      totalCount: [{ $count: 'count' }]
    }
  }
]);

const mcqs = result[0].data;
const total = result[0].totalCount[0]?.count || 0;
```

### 1.3 Fix RegExp Performance Issues

#### File: `/backend/src/controllers/mcqController.js`

**Line 27-30 - Current Code:**
```javascript
if (subject) filter.subject = new RegExp(subject, 'i');
if (chapter) filter.chapter = new RegExp(chapter, 'i');
if (section) filter.section = new RegExp(section, 'i');
if (source) filter.source = new RegExp(source, 'i');
```

**Replace With:**
```javascript
// Use exact match for indexed fields
if (subject) {
  const subjects = subject.split(',').map(s => s.trim());
  filter.subject = { $in: subjects };
}
if (chapter) {
  const chapters = chapter.split(',').map(c => c.trim());
  filter.chapter = { $in: chapters };
}
if (section) {
  const sections = section.split(',').map(s => s.trim());
  filter.section = { $in: sections };
}
if (source) filter.source = source;
```

### 1.4 Add Case-Insensitive Collation

#### File: `/backend/src/models/MCQ.js`

**After line 100 - Add:**
```javascript
// Add case-insensitive collation to the collection
MCQSchema.collation({ locale: 'en', strength: 2 });
```

---

## Phase 2: Frontend Caching & Progressive Loading (2 Hours)
**Impact: Instant repeat visits, no full page reloads**

### 2.1 Implement SessionStorage Caching

#### File: `/frontend/src/hooks/useMCQData.js`

**Complete file replacement:**
```javascript
import { useState, useCallback, useEffect } from 'react';
import { mcqSeriesAPI, mcqAPI } from '../services/mcqApi';

const CACHE_KEYS = {
  SERIES: 'mcq_series_cache',
  FILTER_OPTIONS: 'mcq_filter_options_cache',
  MCQS: 'mcq_list_cache'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
};

const setCachedData = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

export const useMCQData = () => {
  const [series, setSeries] = useState(() => getCachedData(CACHE_KEYS.SERIES) || []);
  const [allMCQs, setAllMCQs] = useState(() => getCachedData(CACHE_KEYS.MCQS) || []);
  const [filterOptions, setFilterOptions] = useState(() =>
    getCachedData(CACHE_KEYS.FILTER_OPTIONS) || {
      subjects: [],
      chapters: [],
      sections: []
    }
  );
  const [loading, setLoading] = useState(false); // Start false if we have cache
  const [error, setError] = useState('');

  // Check if we have cached data on mount
  useEffect(() => {
    const hasCachedData = getCachedData(CACHE_KEYS.SERIES) &&
                          getCachedData(CACHE_KEYS.FILTER_OPTIONS);
    setLoading(!hasCachedData);
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedSeries = getCachedData(CACHE_KEYS.SERIES);
        const cachedFilters = getCachedData(CACHE_KEYS.FILTER_OPTIONS);
        const cachedMCQs = getCachedData(CACHE_KEYS.MCQS);

        if (cachedSeries && cachedFilters && cachedMCQs) {
          setSeries(cachedSeries);
          setFilterOptions(cachedFilters);
          setAllMCQs(cachedMCQs);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError('');

      // Fetch data with individual error handling
      const promises = [
        mcqSeriesAPI.getAll({ limit: 100 }).catch(err => {
          console.error('Series fetch failed:', err);
          return { data: [] };
        }),
        mcqAPI.getAll({ limit: 100 }).catch(err => {
          console.error('MCQs fetch failed:', err);
          return { data: { data: [] } };
        }),
        mcqAPI.getFilterOptions().catch(err => {
          console.error('Filter options fetch failed:', err);
          return { data: { data: {} } };
        })
      ];

      const [seriesResponse, mcqsResponse, filterResponse] = await Promise.all(promises);

      // Process and cache series
      if (seriesResponse?.data && Array.isArray(seriesResponse.data)) {
        setSeries(seriesResponse.data);
        setCachedData(CACHE_KEYS.SERIES, seriesResponse.data);
      }

      // Process and cache MCQs
      if (mcqsResponse?.data?.data && Array.isArray(mcqsResponse.data.data)) {
        setAllMCQs(mcqsResponse.data.data);
        setCachedData(CACHE_KEYS.MCQS, mcqsResponse.data.data);
      }

      // Process and cache filter options
      const filterData = filterResponse?.data?.data || filterResponse?.data || {};
      const options = {
        subjects: filterData.subjects || [],
        chapters: filterData.chapters || [],
        sections: filterData.sections || []
      };
      setFilterOptions(options);
      setCachedData(CACHE_KEYS.FILTER_OPTIONS, options);

    } catch (error) {
      console.error('Failed to fetch MCQ data:', error);
      setError('Failed to load MCQ series data');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    series,
    allMCQs,
    filterOptions,
    loading,
    error,
    fetchData,
    clearCache: () => {
      Object.values(CACHE_KEYS).forEach(key => sessionStorage.removeItem(key));
    }
  };
};
```

### 2.2 Remove Full Page Loading States

#### File: `/frontend/src/pages/BrowseMCQSeries.js`

**Line 71-77 - Current Code:**
```javascript
if (loading) {
  return (
    <div className="browse-loading">
      <div className="loading-spinner"></div>
    </div>
  );
}
```

**Replace With:**
```javascript
// Don't block entire page for loading
// Show skeleton or partial content instead
```

**Line 113-165 - Modify return statement:**
```javascript
return (
  <div className="browse-container">
    <NavigationHeader
      currentMode="mcq"
      supportedModes={['flashcards', 'mcq', 'tables']}
      onNavigateDashboard={handleNavigateDashboard}
      onToggleMode={handleToggleMode}
      onCreateClick={handleCreateClick}
    />

    <FilterSection
      filters={filters}
      filterOptions={filterOptions}
      dropdownOpen={dropdownOpen}
      onFilterToggle={handleFilterToggle}
      onDropdownToggle={toggleDropdown}
      onClearFilters={clearFilters}
      getDropdownText={getDropdownText}
      seriesCount={processedSeries.length}
      totalSeries={series.length}
    />

    {loading && !series.length ? (
      // Only show loading if no cached data
      <div className="content-loading">
        <div className="loading-spinner">Loading series...</div>
      </div>
    ) : error ? (
      <div className="error-container">
        <h2>Error Loading MCQ Series</h2>
        <p>{error}</p>
        <button onClick={() => fetchData(true)} className="retry-btn">
          Retry
        </button>
      </div>
    ) : series.length === 0 ? (
      <div className="empty-container">
        <h2>No MCQ Series Yet</h2>
        <p>Create your first MCQ series to start studying</p>
        <button onClick={handleCreateClick} className="primary-btn">
          Create MCQ Series
        </button>
      </div>
    ) : (
      <MCQSeriesList
        series={processedSeries}
        onSessionClick={handleSessionClick}
        onNewSession={handleNewSession}
        onEditSession={handleEditSession}
        loading={loading} // Pass loading state for subtle indicators
      />
    )}

    {/* Modals remain the same */}
  </div>
);
```

### 2.3 Optimize Create Pages Loading

#### File: `/frontend/src/pages/CreateMCQSeries.js`

**After the fixes from earlier, add prefetch on mount:**

**Add after line 33:**
```javascript
// Prefetch next navigation targets
useEffect(() => {
  // Prefetch browse page data in background
  mcqSeriesAPI.getAll({ limit: 100 }).catch(() => {});
}, []);
```

---

## Phase 3: Advanced Optimizations (3 Hours)
**Impact: Handle 10,000+ items smoothly**

### 3.1 Implement Virtual Scrolling

#### File: `/frontend/package.json`

**Add dependency:**
```json
"react-window": "^1.8.10"
```

#### File: `/frontend/src/pages/CreateMCQSeries.js`

**Line 1 - Add import:**
```javascript
import { FixedSizeGrid } from 'react-window';
```

**Line 449-481 - Replace flashcards grid:**
```javascript
// Calculate grid dimensions
const columnCount = 3;
const rowCount = Math.ceil(filteredMCQs.length / columnCount);
const columnWidth = window.innerWidth / columnCount - 20;
const rowHeight = 150;

<div className="flashcards-grid-container">
  {filteredMCQs.length === 0 ? (
    <div className="no-flashcards-message">
      {filterLoading ? 'Loading MCQs...' : 'No MCQs match your filters'}
    </div>
  ) : (
    <FixedSizeGrid
      className="flashcards-virtual-grid"
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={600}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={window.innerWidth - 40}
    >
      {({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        if (index >= filteredMCQs.length) return null;
        const mcq = filteredMCQs[index];

        return (
          <div style={style}>
            <div
              className={`flashcard-item ${selectedQuestions.includes(mcq.questionId) ? 'selected' : ''}`}
              onClick={() => toggleQuestionSelection(mcq.questionId)}
            >
              <div className="card-header">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(mcq.questionId)}
                  onChange={() => toggleQuestionSelection(mcq.questionId)}
                  className="card-checkbox"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="card-content">
                <h3 className="card-front">
                  {mcq.question.length > 60
                    ? mcq.question.substring(0, 60) + '...'
                    : mcq.question
                  }
                </h3>
              </div>
            </div>
          </div>
        );
      }}
    </FixedSizeGrid>
  )}
</div>
```

### 3.2 Add Request Debouncing for Filters

#### File: `/frontend/src/hooks/useDebounce.js` (NEW FILE)

```javascript
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

#### File: `/frontend/src/pages/CreateMCQSeries.js`

**Add import:**
```javascript
import { useDebounce } from '../hooks/useDebounce';
```

**Modify filter effect:**
```javascript
const debouncedFilters = useDebounce(filters, 300);

useEffect(() => {
  fetchMCQs(false);
}, [currentPage, debouncedFilters]); // Use debounced filters
```

### 3.3 Implement Intersection Observer for Lazy Loading

#### File: `/frontend/src/hooks/useIntersectionObserver.js` (NEW FILE)

```javascript
import { useEffect, useRef } from 'react';

export const useIntersectionObserver = (callback, options = {}) => {
  const observer = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, options);

    if (elementRef.current) {
      observer.current.observe(elementRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [callback, options]);

  return elementRef;
};
```

### 3.4 Add Performance Monitoring

#### File: `/frontend/src/utils/performanceMonitor.js` (NEW FILE)

```javascript
class PerformanceMonitor {
  static timers = {};

  static start(label) {
    this.timers[label] = performance.now();
  }

  static end(label) {
    if (!this.timers[label]) return;
    const duration = performance.now() - this.timers[label];
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    delete this.timers[label];
    return duration;
  }

  static async measure(label, fn) {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  static reportNavigation() {
    const navTiming = performance.getEntriesByType('navigation')[0];
    if (navTiming) {
      console.log('[Performance] Page Load Metrics:', {
        domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
        loadComplete: navTiming.loadEventEnd - navTiming.loadEventStart,
        domInteractive: navTiming.domInteractive - navTiming.fetchStart,
        timeToFirstByte: navTiming.responseStart - navTiming.requestStart
      });
    }
  }
}

export default PerformanceMonitor;
```

---

## Testing & Validation Plan

### Backend Testing

1. **Create test script:** `/backend/scripts/testPerformance.js`
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testEndpoint(name, url) {
  const start = Date.now();
  try {
    await axios.get(url);
    const duration = Date.now() - start;
    console.log(`✓ ${name}: ${duration}ms`);
    return duration;
  } catch (error) {
    console.error(`✗ ${name}: Failed`);
    return null;
  }
}

async function runTests() {
  console.log('Running Performance Tests...\n');

  const tests = [
    ['MCQ Series', `${API_BASE}/mcq-series?limit=100`],
    ['MCQs', `${API_BASE}/mcqs?limit=100`],
    ['Filter Options', `${API_BASE}/mcqs/filter-options`],
    ['MCQs with Filter', `${API_BASE}/mcqs?limit=50&subject=BREAST`]
  ];

  const results = [];
  for (const [name, url] of tests) {
    const duration = await testEndpoint(name, url);
    if (duration) results.push(duration);
  }

  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  console.log(`\nAverage Response Time: ${avg.toFixed(0)}ms`);

  if (avg < 500) {
    console.log('✅ Performance PASS - All endpoints under 500ms average');
  } else {
    console.log('❌ Performance FAIL - Endpoints too slow');
  }
}

runTests();
```

### Frontend Testing

1. **Add performance tracking to App.js:**
```javascript
import PerformanceMonitor from './utils/performanceMonitor';

useEffect(() => {
  PerformanceMonitor.reportNavigation();
}, []);
```

2. **Create Cypress E2E test:** `/frontend/cypress/e2e/performance.cy.js`
```javascript
describe('Performance Tests', () => {
  it('loads MCQ browse page in under 1 second', () => {
    cy.visit('/browse-mcq-series');
    cy.get('[data-testid="series-list"]', { timeout: 1000 }).should('exist');
  });

  it('filters without full page reload', () => {
    cy.visit('/create-mcq-series');
    cy.get('[data-testid="subject-filter"]').click();
    cy.get('[data-testid="filter-option"]').first().click();
    // Should not show full page loader
    cy.get('.create-series-loading').should('not.exist');
    // Grid should update
    cy.get('.flashcards-grid').should('exist');
  });

  it('navigates instantly with cache', () => {
    cy.visit('/browse-mcq-series');
    cy.wait(1000); // Let it cache
    cy.visit('/');
    cy.visit('/browse-mcq-series');
    // Should load instantly from cache
    cy.get('[data-testid="series-list"]', { timeout: 100 }).should('exist');
  });
});
```

---

## Deployment Checklist

### Pre-deployment
- [ ] Run backend performance test script
- [ ] Run frontend Cypress tests
- [ ] Check browser DevTools Network tab - all APIs < 500ms
- [ ] Verify no memory leaks in Chrome DevTools
- [ ] Test on slow 3G throttling

### Post-deployment Monitoring
- [ ] Set up DataDog/NewRelic APM monitoring
- [ ] Create alerts for API response > 1 second
- [ ] Monitor error rates
- [ ] Track user session recordings with Hotjar/FullStory

---

## Rollback Plan

If issues occur after deployment:

1. **Quick Rollback:**
```bash
git revert HEAD~5  # Revert last 5 commits
npm run build
npm run deploy
```

2. **Feature Flags (add to .env):**
```
REACT_APP_USE_CACHE=false
REACT_APP_USE_VIRTUAL_SCROLL=false
REACT_APP_USE_LEAN_QUERIES=false
```

3. **Database Index Rollback:**
```javascript
// Remove problematic indexes if needed
db.mcqs.dropIndex({ subject: 1, chapter: 1, section: 1 });
```

---

## Success Metrics

### Target Performance
- API response time: < 500ms (currently 3200ms)
- Page load time: < 1 second (currently 3-4 seconds)
- Filter change: < 200ms (currently 3+ seconds)
- Cache hit rate: > 80%
- Error rate: < 0.1%

### Monitoring Dashboard
Create dashboard showing:
- P50, P95, P99 response times
- Cache hit/miss ratio
- Error rates by endpoint
- User session duration
- Bounce rate changes