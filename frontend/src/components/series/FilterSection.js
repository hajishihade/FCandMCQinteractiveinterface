import React from 'react';

const FilterSection = React.memo(({
  filters,
  filterOptions,
  dropdownOpen,
  onFilterToggle,
  onDropdownToggle,
  onClearFilters,
  getDropdownText,
  seriesCount,
  totalSeries
}) => {
  return (
    <div className="filters-section">
      <div className="filters-row">

        {/* Subjects Dropdown */}
        <div className="filter-dropdown">
          <button
            className="dropdown-button"
            onClick={() => onDropdownToggle('subjects')}
          >
            {getDropdownText('subjects')} ▼
          </button>
          {dropdownOpen.subjects && (
            <div className="dropdown-content">
              {filterOptions.subjects.map(subject => (
                <label key={subject} className="dropdown-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.subjects.includes(subject)}
                    onChange={() => onFilterToggle('subjects', subject)}
                  />
                  <span className="checkbox-label">{subject}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Chapters Dropdown */}
        <div className="filter-dropdown">
          <button
            className="dropdown-button"
            onClick={() => onDropdownToggle('chapters')}
          >
            {getDropdownText('chapters')} ▼
          </button>
          {dropdownOpen.chapters && (
            <div className="dropdown-content">
              {filterOptions.chapters.map(chapter => (
                <label key={chapter} className="dropdown-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.chapters.includes(chapter)}
                    onChange={() => onFilterToggle('chapters', chapter)}
                  />
                  <span className="checkbox-label">{chapter}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Sections Dropdown */}
        <div className="filter-dropdown">
          <button
            className="dropdown-button"
            onClick={() => onDropdownToggle('sections')}
          >
            {getDropdownText('sections')} ▼
          </button>
          {dropdownOpen.sections && (
            <div className="dropdown-content">
              {filterOptions.sections.map(section => (
                <label key={section} className="dropdown-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.sections.includes(section)}
                    onChange={() => onFilterToggle('sections', section)}
                  />
                  <span className="checkbox-label">{section}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClearFilters}
          className="clear-filters-btn"
        >
          Clear All
        </button>

        <div className="filter-summary">
          Showing {seriesCount} of {totalSeries} series
        </div>

      </div>
    </div>
  );
});

export default FilterSection;