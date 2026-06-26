import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

/**
 * ProgressChart renders a weekly completions bar chart and a task priority donut pie chart.
 */
const ProgressChart = ({ weeklyData = [], priorityData = [] }) => {
  // 1. Transform weeklyData from { day, count } to { day, completed }
  const barChartData = weeklyData.map((item) => ({
    day: item.day,
    completed: item.count,
  }));

  // 2. Transform priorityData (list of tasks) into { name, value } priority counts
  const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
  priorityData.forEach((task) => {
    if (priorityCounts[task.priority] !== undefined) {
      priorityCounts[task.priority]++;
    }
  });

  const pieChartData = [
    { name: 'Urgent', value: priorityCounts.urgent, color: '#ef4444' },
    { name: 'High', value: priorityCounts.high, color: '#f97316' },
    { name: 'Medium', value: priorityCounts.medium, color: '#eab308' },
    { name: 'Low', value: priorityCounts.low, color: '#22c55e' },
  ].filter((item) => item.value > 0);

  const hasPieData = pieChartData.length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Chart 1: Weekly Completions */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Weekly Completions</h3>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #f1f5f9',
                  borderRadius: '8px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              />
              <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Tasks by Priority */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Tasks by Priority</h3>
        <div className="relative h-[220px] w-full flex items-center justify-center">
          {hasPieData ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #f1f5f9',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    verticalAlign="middle"
                    layout="vertical"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, color: '#475569' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center donut label */}
              <div className="absolute flex flex-col items-center justify-center pb-2 pr-28 md:pr-32">
                <span className="text-2xl font-bold text-slate-800">{priorityData.length}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 text-sm">
              <span>No priorities to display</span>
              <span className="text-xs text-slate-300 mt-1">Add tasks to populate chart</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;
