import React from 'react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../../utils/helpers';

/**
 * Badge component
 * @param {Object} props
 * @param {'priority' | 'status' | 'tag'} props.variant - Type of badge
 * @param {string} props.value - Value to display
 */
const Badge = ({ variant, value }) => {
  if (variant === 'priority') {
    const config = PRIORITY_CONFIG[value] || PRIORITY_CONFIG.medium;
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.bg} ${config.color} ${config.border}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        <span>{config.label}</span>
      </span>
    );
  }

  if (variant === 'status') {
    const config = STATUS_CONFIG[value] || STATUS_CONFIG.todo;
    return (
      <span
        className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${config.bg} ${config.color}`}
      >
        <span>{config.label}</span>
      </span>
    );
  }

  // Fallback / Tag variant
  return (
    <span className="inline-flex items-center bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">
      {value}
    </span>
  );
};

export default Badge;
