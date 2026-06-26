import React from 'react';
import { ClipboardList, Sparkles } from 'lucide-react';
import TaskCard from './TaskCard';

/**
 * TaskList component that orchestrates displaying loading skeleton state,
 * empty state, or the responsive grid of TaskCards.
 */
const TaskList = ({ tasks, loading, onUpdate, onDelete, onAISuggest, onEdit, onToggleSubtask }) => {
  // Skeleton loader for when tasks are fetching
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4 animate-pulse">
      {/* Header shimmer */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-100 rounded w-1/4"></div>
        <div className="h-4 bg-slate-100 rounded w-1/5"></div>
      </div>
      {/* Title & Description shimmer */}
      <div className="space-y-2">
        <div className="h-5 bg-slate-100 rounded w-3/4"></div>
        <div className="h-3 bg-slate-100 rounded w-full"></div>
        <div className="h-3 bg-slate-100 rounded w-2/3"></div>
      </div>
      {/* Progress bar shimmer */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between">
          <div className="h-2 bg-slate-100 rounded w-1/6"></div>
          <div className="h-2 bg-slate-100 rounded w-1/6"></div>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full w-full"></div>
      </div>
      {/* Footer shimmer */}
      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
        <div className="h-8 bg-slate-100 rounded w-1/3"></div>
        <div className="h-8 bg-slate-100 rounded w-1/4"></div>
        <div className="flex gap-1.5">
          <div className="h-7 w-7 bg-slate-100 rounded-lg"></div>
          <div className="h-7 w-7 bg-slate-100 rounded-lg"></div>
          <div className="h-7 w-7 bg-slate-100 rounded-lg"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-100 shadow-sm max-w-xl mx-auto mt-6 animate-fade-in">
        <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <ClipboardList className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No tasks found</h3>
        <p className="text-slate-500 text-sm max-w-sm mt-1 leading-relaxed">
          It looks like you don't have any tasks matching your filters. Add a new task to get started on your hackathon goal!
        </p>
        <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mt-4 bg-indigo-50/50 py-1.5 px-3 rounded-full border border-indigo-100/50">
          <Sparkles className="h-3 w-3 fill-indigo-100 animate-pulse" />
          <span>Ask Gemini AI to help organize your sprint</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAISuggest={onAISuggest}
          onEdit={onEdit}
          onToggleSubtask={onToggleSubtask}
        />
      ))}
    </div>
  );
};

export default TaskList;
