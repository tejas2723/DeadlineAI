import React from 'react';

/**
 * SkeletonCard component
 * @param {Object} props
 * @param {number} [props.lines=3] - Number of text lines to display
 */
const SkeletonCard = ({ lines = 3 }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4 animate-pulse w-full">
      {/* Title bar */}
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      
      {/* Text bars */}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, idx) => {
          const isLast = idx === lines - 1 && lines > 1;
          const widthClass = isLast ? 'w-1/2' : 'w-full';
          return (
            <div key={idx} className={`h-3 bg-slate-200 rounded ${widthClass}`} />
          );
        })}
      </div>
    </div>
  );
};

export default SkeletonCard;
