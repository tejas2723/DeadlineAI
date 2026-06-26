// 1. PRIORITY_CONFIG object
export const PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgent',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-600',
    ring: 'ring-red-100',
  },
  high: {
    label: 'High',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-600',
    ring: 'ring-orange-100',
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    dot: 'bg-yellow-600',
    ring: 'ring-yellow-100',
  },
  low: {
    label: 'Low',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    dot: 'bg-green-600',
    ring: 'ring-green-100',
  },
};

// 2. STATUS_CONFIG object
export const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  overdue: {
    label: 'Overdue',
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
};

// 3. formatDeadline(date) -> { text: string, color: string }
export const formatDeadline = (date) => {
  if (!date) return { text: 'No deadline', color: 'text-gray-400' };

  const deadlineDate = new Date(date);
  const now = new Date();

  // Reset hours to midnight for relative comparison
  const deadlineMidnight = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = deadlineMidnight.getTime() - nowMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: `${Math.abs(diffDays)}d overdue`,
      color: 'text-red-600 font-semibold',
    };
  }
  if (diffDays === 0) {
    return {
      text: 'Due today',
      color: 'text-orange-600 font-semibold',
    };
  }
  if (diffDays === 1) {
    return {
      text: 'Due tomorrow',
      color: 'text-yellow-600 font-medium',
    };
  }
  if (diffDays >= 2 && diffDays <= 7) {
    return {
      text: `${diffDays} days left`,
      color: 'text-blue-600',
    };
  }
  
  // Format as date: e.g. "15 Jan"
  const text = deadlineDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return {
    text,
    color: 'text-gray-500',
  };
};

// 4. completionRate(tasks) -> number 0-100
export const completionRate = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
};

// 5. formatHours(hours) -> string
export const formatHours = (hours) => {
  if (!hours || hours <= 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (h === 0 && m > 0) return `${m}m`;
  if (h > 0 && m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// 6. groupByPriority(tasks) -> { urgent: [], high: [], medium: [], low: [] }
export const groupByPriority = (tasks) => {
  const grouped = { urgent: [], high: [], medium: [], low: [] };
  if (Array.isArray(tasks)) {
    tasks.forEach((task) => {
      if (grouped[task.priority]) {
        grouped[task.priority].push(task);
      }
    });
  }
  return grouped;
};

// 7. getDaysInWeek() -> array of last 7 day labels ["Mon", "Tue", ...]
export const getDaysInWeek = () => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    result.push(dayNames[d.getDay()]);
  }
  return result;
};
