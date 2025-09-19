import React from 'react';
import SessionItem from './SessionItem';

const SessionItemsList = React.memo(({
  items,
  isFlashcard,
  loading
}) => {
  if (loading) {
    return (
      <div className="breakdown-section">
        <h3>Individual {isFlashcard ? 'Cards' : 'Questions'} Performance</h3>
        <div className="loading-items">Loading content...</div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="breakdown-section">
        <h3>Individual {isFlashcard ? 'Cards' : 'Questions'} Performance</h3>
        <div className="no-items">No items found in this session.</div>
      </div>
    );
  }

  return (
    <div className="breakdown-section items-section">
      <h3>Individual {isFlashcard ? 'Cards' : 'Questions'} Performance ({items.length} items)</h3>
      <div className="items-list">
        {items.map((item, index) => (
          <SessionItem
            key={item.id}
            item={item}
            index={index + 1}
            isFlashcard={isFlashcard}
          />
        ))}
      </div>
    </div>
  );
});

export default SessionItemsList;