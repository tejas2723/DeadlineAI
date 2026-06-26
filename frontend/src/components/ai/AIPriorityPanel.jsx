import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * AIPriorityPanel fetches task prioritization analysis from Gemini and maps it to a styled dashboard card.
 */
const AIPriorityPanel = () => {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeAgo, setTimeAgo] = useState('');

  // Fetch AI priorities from backend API
  const fetchPriorities = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/prioritize');
      setAdvice(res.data.advice || '');
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load AI priority advisor recommendations:', err);
      setAdvice('Could not load AI prioritizations. Make sure your GEMINI_API_KEY is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch advice on mount
  useEffect(() => {
    fetchPriorities();
  }, []);

  // Update timeAgo string using a relative elapsed time counter
  useEffect(() => {
    if (!lastUpdated) return;

    const updateTime = () => {
      const diffMs = new Date() - lastUpdated;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins === 0) {
        setTimeAgo('just now');
      } else if (diffMins === 1) {
        setTimeAgo('1 minute ago');
      } else {
        setTimeAgo(`${diffMins} minutes ago`);
      }
    };

    updateTime(); // Run immediately
    const interval = setInterval(updateTime, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Line-by-line custom text formatter
  const renderAdviceLine = (line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-2" />; // Spacer

    // Bold numbered headings (e.g. "1. Today's Focus:")
    if (/^\d+[.)]\s/.test(trimmed)) {
      return (
        <p key={idx} className="font-bold text-slate-800 text-sm mt-4 mb-2 leading-relaxed flex items-center gap-1.5">
          {trimmed}
        </p>
      );
    }

    // Bullet points (e.g. "- Build login page")
    if (/^[-*•]\s/.test(trimmed)) {
      const text = trimmed.replace(/^[-*•]\s/, '');
      return (
        <div key={idx} className="flex items-start gap-2 pl-4 py-1 text-sm text-slate-600 leading-relaxed">
          <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
          <span>{text}</span>
        </div>
      );
    }

    // Default paragraph text
    return (
      <p key={idx} className="text-sm text-slate-600 leading-relaxed my-1">
        {trimmed}
      </p>
    );
  };

  // Shimmer animation rows for loading states
  const ShimmerLoader = () => (
    <div className="space-y-3.5 animate-pulse py-2">
      <div className="h-4 bg-indigo-100 rounded w-1/3"></div>
      <div className="h-3 bg-slate-200/80 rounded w-full"></div>
      <div className="h-3 bg-slate-200/80 rounded w-11/12"></div>
      <div className="h-3 bg-slate-200/80 rounded w-4/5"></div>
      <div className="h-4 bg-indigo-100 rounded w-1/4 mt-4"></div>
      <div className="h-3 bg-slate-200/80 rounded w-full"></div>
      <div className="h-3 bg-slate-200/80 rounded w-5/6"></div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between border-t-4 border-t-indigo-500 h-full min-h-[300px]">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-indigo-100/50 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 fill-indigo-100 animate-spin-slow" />
            <h3 className="text-sm font-bold text-slate-800">AI Priority Advisor</h3>
          </div>
          <button
            onClick={fetchPriorities}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 focus:outline-none transition-colors disabled:text-indigo-400"
          >
            {loading ? (
              <LoadingSpinner size="sm" color="indigo" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>Refresh</span>
          </button>
        </div>

        {/* Content Panel */}
        {loading ? (
          <ShimmerLoader />
        ) : (
          <div className="text-slate-700 overflow-y-auto max-h-[380px] pr-1">
            {advice ? (
              advice.split('\n').map((line, idx) => renderAdviceLine(line, idx))
            ) : (
              <p className="text-sm text-slate-500 italic">No recommendations loaded.</p>
            )}
          </div>
        )}
      </div>

      {/* Footer stamp */}
      {lastUpdated && !loading && (
        <div className="bg-indigo-100/20 px-5 py-2.5 border-t border-indigo-100/50 text-[10px] text-indigo-500 font-medium text-right">
          Last updated: {timeAgo}
        </div>
      )}
    </div>
  );
};

export default AIPriorityPanel;
