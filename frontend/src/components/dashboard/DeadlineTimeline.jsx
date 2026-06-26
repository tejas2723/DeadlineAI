import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { formatDeadline, PRIORITY_CONFIG } from '../../utils/helpers';

/**
 * DeadlineTimeline lists up to 5 upcoming tasks with priority colors and relative deadlines.
 */
const DeadlineTimeline = ({ tasks = [] }) => {
  const navigate = useNavigate();

  // Filter out completed tasks (only show active ones) and limit to top 5
  const activeTasks = tasks
    .filter((t) => t.status !== 'completed')
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-800">Upcoming Deadlines</h3>
        </div>

        {activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 text-sm">
            <span className="text-2xl">🎉</span>
            <p className="mt-2 font-medium">No upcoming deadlines!</p>
            <p className="text-xs text-slate-300">You're all caught up.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeTasks.map((task) => {
              const deadlineInfo = formatDeadline(task.deadline);
              const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              
              return (
                <div
                  key={task._id}
                  onClick={() => navigate('/tasks')}
                  className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Priority Color Dot */}
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${priorityInfo.dot}`} />
                    <span className="truncate text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {task.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Priority Badge */}
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${priorityInfo.bg} ${priorityInfo.color}`}>
                      {priorityInfo.label}
                    </span>
                    {/* Deadline Status Color */}
                    <span className={`text-xs ${deadlineInfo.color}`}>
                      {deadlineInfo.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {tasks.length > 0 && (
        <button
          onClick={() => navigate('/tasks')}
          className="mt-4 text-center text-xs font-bold text-indigo-600 hover:text-indigo-500 hover:underline pt-2 focus:outline-none border-t border-slate-50"
        >
          View all tasks →
        </button>
      )}
    </div>
  );
};

export default DeadlineTimeline;
