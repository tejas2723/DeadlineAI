import React, { useState } from 'react';
import { Clock, Sparkles, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { formatDeadline, formatHours, PRIORITY_CONFIG } from '../../utils/helpers';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * TaskCard displays details of a single task, subtask progress, and actions (edit, delete, status select, AI suggestion).
 */
const TaskCard = ({ task, onUpdate, onDelete, onAISuggest, onEdit, onToggleSubtask }) => {
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);

  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const deadlineInfo = formatDeadline(task.deadline);

  // Subtask progress calculations
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const completedSubtasks = task.subtasks ? task.subtasks.filter((s) => s.completed).length : 0;
  const subtaskPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleStatusChange = (e) => {
    onUpdate(task._id, { status: e.target.value });
  };

  const handleAISuggestClick = async () => {
    if (!task.aiSuggestion) {
      setAiLoading(true);
      setShowAI(true);
      try {
        await onAISuggest(task._id);
      } catch (err) {
        console.error('Failed to get AI recommendation:', err);
      } finally {
        setAiLoading(false);
      }
    } else {
      setShowAI(!showAI);
    }
  };

  const handleDeleteClick = () => {
    onDelete(task._id);
  };

  const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 }[task.priority] || 2;
  const energyWeight = { high: 3, medium: 2, low: 1 }[task.energy] || 2;
  const score = priorityWeight * energyWeight;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between task-card-hover transition-all">
      {/* Header: Priority & Deadline */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          {/* Priority indicators */}
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${priorityInfo.dot}`} />
            <span className={`font-semibold uppercase ${priorityInfo.color}`}>
              {priorityInfo.label}
            </span>
            <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-indigo-100/50 font-mono flex items-center gap-0.5" title="Urgency × Energy Rank">
              ⚡ {score}/12
            </span>
          </div>
          {/* Deadline */}
          <span className={`text-xs ${deadlineInfo.color}`}>
            {deadlineInfo.text}
          </span>
        </div>

        {/* Title & Description */}
        <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Tags & Smart Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {/* Energy Smart Tag */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
            task.energy === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
            task.energy === 'low' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
            'bg-blue-50 text-blue-700 border border-blue-100'
          }`}>
            <span>🔋</span>
            <span className="capitalize">{task.energy || 'medium'}</span>
          </span>

          {/* Cognitive Effort Smart Tag */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
            task.cognitiveEffort === 'high' ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100' :
            task.cognitiveEffort === 'low' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
            'bg-slate-50 text-slate-700 border border-slate-100'
          }`}>
            <span>🧠</span>
            <span className="capitalize">{task.cognitiveEffort || 'medium'}</span>
          </span>

          {/* User Custom Tags */}
          {task.tags && task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Subtask Progress Bar & Checklist */}
        {totalSubtasks > 0 && (
          <div className="mt-4 space-y-1.5">
            <button
              onClick={() => setShowSubtasks(!showSubtasks)}
              type="button"
              className="flex items-center justify-between w-full text-[10px] text-slate-500 font-semibold hover:text-indigo-600 transition-colors focus:outline-none"
            >
              <span>Subtasks ({completedSubtasks}/{totalSubtasks})</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${showSubtasks ? 'rotate-180 text-indigo-600' : ''}`} />
            </button>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${subtaskPercentage}%` }}
              />
            </div>

            {showSubtasks && (
              <div className="mt-2 space-y-1 max-h-[120px] overflow-y-auto pt-1 border-t border-slate-50 animate-fade-in pr-0.5">
                {task.subtasks.map((subtask) => (
                  <label
                    key={subtask._id}
                    className="flex items-start gap-2 py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => onToggleSubtask(task._id, subtask._id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300 mt-0.5"
                    />
                    <span className={`text-[11px] font-medium leading-tight ${subtask.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {subtask.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Action Row */}
      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={handleStatusChange}
          className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg pl-2 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>

        {/* Hour estimate badge */}
        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md shrink-0">
          <Clock className="h-3 w-3 text-slate-400" />
          <span>{formatHours(task.estimatedHours)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1">
          {/* AI Advisor Suggest button */}
          <button
            onClick={handleAISuggestClick}
            disabled={aiLoading}
            className={`p-1.5 rounded-lg border transition-colors focus:outline-none ${
              showAI
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/30'
            }`}
            title="Generate AI advice for this task"
          >
            {aiLoading ? (
              <LoadingSpinner size="sm" color="indigo" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Edit button */}
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
            title="Edit task"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors focus:outline-none"
            title="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* AI Suggestion Panel */}
      {showAI && (
        <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 animate-fade-in">
          <div className="flex items-center gap-1 font-semibold text-indigo-700 mb-1 border-b border-indigo-100 pb-1">
            <Sparkles className="h-3 w-3 fill-indigo-200 text-indigo-600" />
            <span>AI Suggestion</span>
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2 text-indigo-500 py-1.5">
              <LoadingSpinner size="sm" color="indigo" />
              <span>Analyzing task...</span>
            </div>
          ) : task.aiSuggestion ? (
            <p className="leading-relaxed mt-1 text-indigo-950 font-medium">{task.aiSuggestion}</p>
          ) : (
            <p className="text-slate-500 italic mt-1">No recommendation loaded.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
