import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
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
      <Route
        path="/"
        element={
          <Dashboard
            onCreateSeries={handleCreateSeries}
            onBrowseSeries={handleBrowseSeries}
            onCreateMCQSeries={handleCreateMCQSeries}
            onBrowseMCQSeries={handleBrowseMCQSeries}
          />
        }
      />
      <Route path="/create-series" element={<CreateSeries />} />
      <Route path="/study" element={<StudySession />} />
      <Route path="/browse-series" element={<BrowseSeries />} />
      <Route path="/create-mcq-series" element={<CreateMCQSeries />} />
      <Route path="/mcq-study" element={<MCQSession />} />
      <Route path="/browse-mcq-series" element={<BrowseMCQSeries />} />
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
