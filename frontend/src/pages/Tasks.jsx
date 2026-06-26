import React, { useState, useEffect } from 'react';
import { Search, Plus, RotateCcw, SlidersHorizontal } from 'lucide-react';
import useTasks from '../hooks/useTasks';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import ConfirmModal from '../components/ui/ConfirmModal';

const Tasks = () => {
  const {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    suggestForTask,
  } = useTasks();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null); // Custom modal deletion state
  
  // Local Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgency-energy');

  // Fetch tasks on initial render
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle CRUD submissions
  const handleCreateSubmit = async (taskData) => {
    try {
      await createTask(taskData);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleUpdateSubmit = async (taskData) => {
    if (!editingTask) return;
    try {
      await updateTask(editingTask._id, taskData);
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setStatusFilter('all');
    setSortBy('urgency-energy');
  };

  // Local Client-side Filtering & Sorting Logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getTaskScore = (task) => {
    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 }[task.priority] || 2;
    const energyWeight = { high: 3, medium: 2, low: 1 }[task.energy] || 2;
    return priorityWeight * energyWeight;
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'urgency-energy') {
      return getTaskScore(b) - getTaskScore(a);
    }
    if (sortBy === 'deadline') {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    return 0;
  });

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (priorityFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'urgency-energy' ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2">
            <span>Sprint Backlog</span>
            <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2.5 py-1 rounded-full border border-indigo-100 font-mono">
              {tasks.length} Total
            </span>
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage your project goals, checklist items, and task priorities.
          </p>
        </div>
        {/* Desktop Add button */}
        <button
          onClick={() => setShowForm(true)}
          className="hidden sm:flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            disabled={loading}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description or tag..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        {/* Filters Group (stacks on mobile side-by-side) */}
        <div className="flex w-full md:w-auto flex-row items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            disabled={loading}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="flex-1 md:flex-none text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all hover:bg-slate-100/50 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            disabled={loading}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all hover:bg-slate-100/50 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Sorting Option */}
          <select
            value={sortBy}
            disabled={loading}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 md:flex-none text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all hover:bg-slate-100/50 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="urgency-energy">Sort: Urgency × Energy</option>
            <option value="deadline">Sort: Soonest Deadline</option>
          </select>

          {/* Reset Filters button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-red-500 font-semibold hover:bg-red-50 py-2 px-3 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Grid / Content Area */}
      <TaskList
        tasks={sortedTasks}
        loading={loading}
        onUpdate={updateTask}
        onDelete={setTaskToDelete} // Trigger custom deletion modal
        onAISuggest={suggestForTask}
        onEdit={handleEditClick}
        onToggleSubtask={toggleSubtask}
      />

      {/* Floating Add Task FAB (Mobile Only) */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 z-40 sm:hidden flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all"
        title="Add Task"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Task Creation Modal */}
      <TaskForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleCreateSubmit}
      />

      {/* Task Editing Modal */}
      <TaskForm
        isOpen={!!editingTask}
        onClose={handleCloseForm}
        onSubmit={handleUpdateSubmit}
        task={editingTask}
      />

      {/* Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action is permanent and cannot be undone."
        dangerous
        onConfirm={async () => {
          if (taskToDelete) {
            try {
              await deleteTask(taskToDelete);
            } catch (err) {
              console.error(err);
            } finally {
              setTaskToDelete(null);
            }
          }
        }}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
};

export default Tasks;
