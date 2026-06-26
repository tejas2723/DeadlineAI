import React from 'react';
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

/**
 * StatsCards displays metric summaries inside a responsive 4-column grid.
 */
const StatsCards = ({ stats }) => {
  const { total = 0, completed = 0, inProgress = 0, overdue = 0, completionRate = 0 } = stats || {};

  const cards = [
    {
      title: 'Total Tasks',
      value: total,
      icon: ClipboardList,
      colorClass: 'text-indigo-600 bg-indigo-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-100',
    },
    {
      title: 'Completed',
      value: completed,
      icon: CheckCircle2,
      colorClass: 'text-green-600 bg-green-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-100',
      showProgress: true,
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: Clock,
      colorClass: 'text-blue-600 bg-blue-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-100',
    },
    {
      title: 'Overdue',
      value: overdue,
      icon: AlertCircle,
      colorClass: overdue > 0 ? 'text-red-600 bg-red-100' : 'text-slate-600 bg-slate-50',
      bgColor: overdue > 0 ? 'bg-red-50/50' : 'bg-white',
      borderColor: overdue > 0 ? 'border-red-200' : 'border-gray-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`${card.bgColor} ${card.borderColor} rounded-xl border p-5 shadow-sm flex flex-col justify-between transition-all`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{card.title}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold tracking-tight text-slate-900">{card.value}</span>
              </div>
            </div>
            
            {card.showProgress && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Completion Rate</span>
                  <span className="font-semibold text-slate-700">{completionRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
