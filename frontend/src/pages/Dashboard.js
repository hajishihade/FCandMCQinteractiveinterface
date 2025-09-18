import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = ({ onCreateSeries, onBrowseSeries, onCreateMCQSeries, onBrowseMCQSeries }) => {
  const [activeMode, setActiveMode] = useState('flashcards');

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Study Hub</h1>
      </div>

      <div className="mode-selector">
        <button
          className={`mode-btn ${activeMode === 'flashcards' ? 'active' : ''}`}
          onClick={() => setActiveMode('flashcards')}
        >
          Flashcards
        </button>
        <button
          className={`mode-btn ${activeMode === 'mcq' ? 'active' : ''}`}
          onClick={() => setActiveMode('mcq')}
        >
          MCQ
        </button>
      </div>

      <div className="action-buttons">
        {activeMode === 'flashcards' ? (
          <>
            <button className="action-btn primary-btn" onClick={onBrowseSeries}>
              Study Flashcards
            </button>
            <button className="action-btn secondary-btn" onClick={onCreateSeries}>
              Create New Series
            </button>
          </>
        ) : (
          <>
            <button className="action-btn primary-btn" onClick={onBrowseMCQSeries}>
              Study MCQ
            </button>
            <button className="action-btn secondary-btn" onClick={onCreateMCQSeries}>
              Create New Series
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;