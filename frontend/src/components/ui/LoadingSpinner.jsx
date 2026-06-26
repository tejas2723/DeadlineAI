import React from 'react';

/**
 * LoadingSpinner component
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Spinner dimensions
 * @param {'white' | 'indigo' | 'gray'} [props.color='indigo'] - Color scheme
 */
const LoadingSpinner = ({ size = 'md', color = 'indigo' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-4',
    lg: 'h-10 w-10 border-4',
  };

  const colorClasses = {
    white: 'border-white border-t-transparent',
    indigo: 'border-indigo-600 border-t-transparent',
    gray: 'border-slate-300 border-t-transparent',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size] || sizeClasses.md} ${
        colorClasses[color] || colorClasses.indigo
      }`}
    />
  );
};

export default LoadingSpinner;
