import React from 'react';
import { Search, RefreshCw, X } from 'lucide-react';
import './FilterBar.css';

/**
 * Standard Filter Bar Component
 * @param {string} searchQuery - The current search query
 * @param {function} onSearchChange - Handler for search input change
 * @param {function} onReset - Handler for reset button click
 * @param {React.ReactNode} children - Dropdown filters or other controls
 * @param {boolean} isLoading - Loading state for refresh icon
 * @param {string} searchPlaceholder - Placeholder text for search
 */
const FilterBar = ({
  searchQuery = '',
  onSearchChange,
  onReset,
  children,
  isLoading = false,
  searchPlaceholder = 'Search...',
}) => {
  return (
    <div className="filter-bar-container">
      {/* Search Section (Left) */}
      <div className="filter-search-wrapper">
        <Search className="filter-search-icon" size={18} />
        <input
          type="text"
          className="filter-search-input"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
        />
        {searchQuery && (
            <button
                className="filter-search-clear"
                onClick={() => onSearchChange && onSearchChange('')}
                title="Clear Search"
            >
                <X size={14} />
            </button>
        )}
      </div>

      {/* Filters Section (Middle) */}
      <div className="filter-controls">
        {children}
      </div>

      {/* Reset Section (Right) */}
      <div className="filter-reset-wrapper">
        <button
          className="btn-reset-circular"
          onClick={onReset}
          title="Reset Filters & Refresh"
          disabled={isLoading}
        >
          <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
