import React from 'react';
import './GradeTabs.css';

/**
 * Standard Grade Tabs Component
 * @param {string} activeGrade - The currently active grade
 * @param {function} onTabClick - Handler when a tab is clicked
 * @param {Array} grades - List of grade objects { key, label } or strings
 */
const GradeTabs = ({ activeGrade, onTabClick, grades = [] }) => {
  return (
    <div className="grade-tabs-container">
      {grades.map((grade) => {
        const gradeKey = typeof grade === 'object' ? grade.key : grade;
        const gradeLabel = typeof grade === 'object' ? grade.label : grade;
        const isActive = activeGrade === gradeKey;

        return (
          <button
            key={gradeKey}
            className={`grade-tab ${isActive ? 'active' : ''}`}
            onClick={() => onTabClick(gradeKey)}
          >
            {gradeLabel}
          </button>
        );
      })}
    </div>
  );
};

export default GradeTabs;
