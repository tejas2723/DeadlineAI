import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { PRIORITY_CONFIG } from '../../utils/helpers';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const TaskForm = ({ isOpen, onClose, onSubmit, task = null }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [deadline, setDeadline] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [tags, setTags] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [energy, setEnergy] = useState('medium');
  const [cognitiveEffort, setCognitiveEffort] = useState('medium');

  // Initialize form fields when task changes or when opening/closing
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'todo');
      // Format deadline to YYYY-MM-DD
      if (task.deadline) {
        setDeadline(new Date(task.deadline).toISOString().split('T')[0]);
      } else {
        setDeadline('');
      }
      setEstimatedHours(task.estimatedHours || 1);
      setTags(task.tags ? task.tags.join(', ') : '');
      setSubtasks(task.subtasks || []);
      setEnergy(task.energy || 'medium');
      setCognitiveEffort(task.cognitiveEffort || 'medium');
    } else {
      // Clear fields for new task
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDeadline('');
      setEstimatedHours(1);
      setTags('');
      setSubtasks([]);
      setEnergy('medium');
      setCognitiveEffort('medium');
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { title: '', completed: false }]);
  };

  const handleSubtaskTextChange = (index, value) => {
    const updated = [...subtasks];
    updated[index].title = value;
    setSubtasks(updated);
  };

  const handleSubtaskStatusChange = (index, value) => {
    const updated = [...subtasks];
    updated[index].completed = value;
    setSubtasks(updated);
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, idx) => idx !== index));
  };

  const handleAIBreakdown = async () => {
    if (!task || !task._id) return;
    setAiLoading(true);
    try {
      const res = await api.post(`/ai/breakdown/${task._id}`);
      if (res.data && res.data.task) {
        setSubtasks(res.data.task.subtasks || []);
        toast.success(`AI generated ${res.data.subtasksCreated} subtasks successfully!`);
      }
    } catch (err) {
      console.error('Failed to generate AI breakdown:', err);
      toast.error(err.response?.data?.message || 'Failed to generate AI subtask breakdown.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!deadline) {
      toast.error('Deadline is required');
      return;
    }

    // Parse tags: split by comma, trim whitespace, filter out empty values
    const parsedTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '');

    // Filter out subtasks with empty titles
    const filteredSubtasks = subtasks.filter((s) => s.title.trim() !== '');

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      deadline: new Date(deadline + 'T23:59:59').toISOString(),
      estimatedHours: Number(estimatedHours),
      tags: parsedTags,
      subtasks: filteredSubtasks,
      energy,
      cognitiveEffort,
    };

    onSubmit(taskData);
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-100 flex flex-col max-h-[90vh] animate-fade-in animate-duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement user authentication"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the task..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Priority (Segmented Group) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => {
                const isSelected = priority === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPriority(key)}
                    className={`py-2 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all ${
                      isSelected
                        ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-2 ${cfg.ring}`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status & Deadline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={minDate}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
              />
            </div>
          </div>

          {/* Estimated Hours & Tags Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estimated Hours */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Effort (Hours)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />
                <span className="w-12 text-center text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-md py-1 px-1.5 font-mono">
                  {estimatedHours}h
                </span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="frontend, auth, bug"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Energy & Cognitive Effort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Energy Required */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Energy Level Required
              </label>
              <select
                value={energy}
                onChange={(e) => setEnergy(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="low">Low Energy (Routine, easy tasks)</option>
                <option value="medium">Medium Energy (Average focus)</option>
                <option value="high">High Energy (Deep focus, coding/writing)</option>
              </select>
            </div>

            {/* Cognitive Effort */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cognitive Effort
              </label>
              <select
                value={cognitiveEffort}
                onChange={(e) => setCognitiveEffort(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="low">Low Effort (Quick checklist, updates)</option>
                <option value="medium">Medium Effort (Design, code tweaks)</option>
                <option value="high">High Effort (Complex architecture, debugging)</option>
              </select>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="pt-2 border-t border-slate-50">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Subtask Checklist ({subtasks.length})
              </label>
              <div className="flex items-center gap-2">
                {task && task._id && (
                  <button
                    type="button"
                    onClick={handleAIBreakdown}
                    disabled={aiLoading}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 py-1 px-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <LoadingSpinner size="sm" color="indigo" />
                    ) : (
                      <Sparkles className="h-3 w-3 fill-indigo-100" />
                    )}
                    <span>AI Breakdown</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-1 px-2 rounded-lg transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Subtask</span>
                </button>
              </div>
            </div>

            {subtasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">No subtasks added yet.</p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2 animate-fade-in">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={(e) => handleSubtaskStatusChange(index, e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
                    />
                    <input
                      type="text"
                      required
                      value={subtask.title}
                      onChange={(e) => handleSubtaskTextChange(index, e.target.value)}
                      placeholder="e.g. Design mockups"
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm hover:shadow-indigo-500/10 transition-all"
          >
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
