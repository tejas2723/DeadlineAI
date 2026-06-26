import React from 'react';

/**
 * EmptyState component
 * @param {Object} props
 * @param {React.ComponentType} [props.icon] - Lucide icon class component
 * @param {string} props.title - Main header title
 * @param {string} props.description - Explanatory body text
 * @param {Object} [props.action] - Optional button trigger
 * @param {string} props.action.label - Button text
 * @param {Function} props.action.onClick - Button click handler
 */
const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-slate-100 shadow-sm w-full max-w-md mx-auto animate-fade-in">
      {Icon && (
        <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <Icon className="h-10 w-10 text-slate-300" />
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50/30 hover:border-indigo-300 font-semibold text-xs rounded-xl transition-all active:scale-95 focus:outline-none"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
