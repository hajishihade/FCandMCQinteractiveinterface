import React from 'react';
import TableSeriesItem from './TableSeriesItem';

const TableSeriesList = ({
  series,
  onSessionClick,
  onNewSession,
  onEditSession
}) => {

  if (series.length === 0) {
    return (
      <div className="empty-container">
        <h2>No Table Quiz Series Found</h2>
        <p>Try adjusting your filters or create a new table series</p>
      </div>
    );
  }

  return (
    <div className="series-list">
      {series.map((seriesItem, index) => (
        <TableSeriesItem
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

export default TableSeriesList;