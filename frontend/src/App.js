import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateSeries from './pages/CreateSeries';
import StudySession from './pages/StudySession';
import BrowseSeries from './pages/BrowseSeries';
import './App.css';

function AppContent() {
  const navigate = useNavigate();

  const handleCreateSeries = () => {
    navigate('/create-series');
  };

  const handleBrowseSeries = () => {
    navigate('/browse-series');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Dashboard
            onCreateSeries={handleCreateSeries}
            onBrowseSeries={handleBrowseSeries}
          />
        }
      />
      <Route path="/create-series" element={<CreateSeries />} />
      <Route path="/study" element={<StudySession />} />
      <Route path="/browse-series" element={<BrowseSeries />} />
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
