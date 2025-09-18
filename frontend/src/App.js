import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import CreateSeries from './pages/CreateSeries';
import StudySession from './pages/StudySession';
import BrowseSeries from './pages/BrowseSeries';
import CreateMCQSeries from './pages/CreateMCQSeries';
import MCQSession from './pages/MCQSession';
import BrowseMCQSeries from './pages/BrowseMCQSeries';
import './App.css';

function AppContent() {
  const navigate = useNavigate();

  const handleCreateSeries = () => {
    navigate('/create-series');
  };

  const handleBrowseSeries = () => {
    navigate('/browse-series');
  };

  const handleCreateMCQSeries = () => {
    navigate('/create-mcq-series');
  };

  const handleBrowseMCQSeries = () => {
    navigate('/browse-mcq-series');
  };

  return (
    <Routes>
      <Route path="/" element={<ErrorBoundary><AnalyticsDashboard /></ErrorBoundary>} />
      <Route path="/browse-series" element={<ErrorBoundary><BrowseSeries /></ErrorBoundary>} />
      <Route path="/browse-mcq-series" element={<ErrorBoundary><BrowseMCQSeries /></ErrorBoundary>} />
      <Route path="/create-series" element={<ErrorBoundary><CreateSeries /></ErrorBoundary>} />
      <Route path="/study" element={<ErrorBoundary><StudySession /></ErrorBoundary>} />
      <Route path="/create-mcq-series" element={<ErrorBoundary><CreateMCQSeries /></ErrorBoundary>} />
      <Route path="/mcq-study" element={<ErrorBoundary><MCQSession /></ErrorBoundary>} />
      <Route
        path="/dashboard"
        element={
          <ErrorBoundary>
            <Dashboard
              onCreateSeries={handleCreateSeries}
              onBrowseSeries={handleBrowseSeries}
              onCreateMCQSeries={handleCreateMCQSeries}
              onBrowseMCQSeries={handleBrowseMCQSeries}
            />
          </ErrorBoundary>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <AppContent />
      </div>
    </Router>
  );
}

export default App;
