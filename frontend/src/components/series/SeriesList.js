import React from 'react';
import SeriesItem from './SeriesItem';

const SeriesList = ({
  series,
  onSessionClick,
  onNewSession,
  onEditSession
}) => {

  if (series.length === 0) {
    return (
      <div className="empty-container">
        <h2>No Series Found</h2>
        <p>Try adjusting your filters or create a new series</p>
      </div>
    );
  }

  return (
    <div className="series-list">
      {series.map((seriesItem, index) => (
        <SeriesItem
          key={seriesItem._id}
          seriesData={seriesItem}
          onSessionClick={onSessionClick}
          onNewSession={onNewSession}
          onEditSession={onEditSession}
          showDivider={index > 0}
        />
      ))}
    </div>
  );
};

export default SeriesList;