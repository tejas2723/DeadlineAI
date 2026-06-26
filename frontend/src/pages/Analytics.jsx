import React, { useState, useEffect } from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Calendar,
  Zap,
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import SkeletonCard from '../components/ui/SkeletonCard';

const Analytics = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('this-week'); // 'this-week', 'last-30', 'all-time'

  // Fetch all tasks for client-side aggregations
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks', { params: { limit: 100 } });
      setAllTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks for analytics:', err);
      toast.error('Failed to load productivity metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Filter tasks based on selected Time Range filter
  const getFilteredTasks = (tasks, range) => {
    const now = new Date();
    if (range === 'this-week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return tasks.filter(
        (t) =>
          new Date(t.createdAt) >= sevenDaysAgo ||
          (t.completedAt && new Date(t.completedAt) >= sevenDaysAgo)
      );
    }
    if (range === 'last-30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return tasks.filter(
        (t) =>
          new Date(t.createdAt) >= thirtyDaysAgo ||
          (t.completedAt && new Date(t.completedAt) >= thirtyDaysAgo)
      );
    }
    return tasks; // all-time
  };

  const filteredTasks = getFilteredTasks(allTasks, timeRange);

  // Helper 1: Build last-7-days created vs completed data for AreaChart
  const buildWeeklyData = (tasksList) => {
    const result = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - i);

      const weekday = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = targetDate.getDate();
      const dateLabel = `${weekday} ${dayNum}`;

      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      const createdCount = tasksList.filter((t) => {
        const cDate = new Date(t.createdAt);
        return cDate >= startOfDay && cDate <= endOfDay;
      }).length;

      const completedCount = tasksList.filter((t) => {
        if (!t.completedAt) return false;
        const compDate = new Date(t.completedAt);
        return compDate >= startOfDay && compDate <= endOfDay;
      }).length;

      result.push({
        date: dateLabel,
        created: createdCount,
        completed: completedCount,
      });
    }

    return result;
  };

  // Helper 2: Calculate average completion duration per priority level for BarChart
  const buildAvgTimeData = (tasksList) => {
    const completedTasks = tasksList.filter(
      (t) => t.status === 'completed' && t.completedAt && t.createdAt
    );
    const priorities = ['urgent', 'high', 'medium', 'low'];
    const labels = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };
    const colors = { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };

    return priorities.map((p) => {
      const priorityTasks = completedTasks.filter((t) => t.priority === p);
      const totalHours = priorityTasks.reduce((sum, t) => {
        const diffMs = new Date(t.completedAt) - new Date(t.createdAt);
        return sum + diffMs / (1000 * 60 * 60);
      }, 0);
      const avgHours = priorityTasks.length > 0 ? Math.round(totalHours / priorityTasks.length) : 0;

      return {
        priority: labels[p],
        avgHours,
        color: colors[p],
      };
    });
  };

  // Helper 3: Calculate streak (consecutive days with at least 1 completion ending today/yesterday)
  const calcStreak = (tasksList) => {
    const completedTasks = tasksList.filter((t) => t.status === 'completed' && t.completedAt);
    if (completedTasks.length === 0) return 0;

    // Extract midnight timestamps for each completion
    const timestamps = completedTasks.map((t) => {
      const d = new Date(t.completedAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    });

    // Remove duplicates and sort in descending order (latest first)
    const uniqueSorted = [...new Set(timestamps)].sort((a, b) => b - a);

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const yesterdayMidnight = todayMidnight - 24 * 60 * 60 * 1000;

    // If the latest completion date is older than yesterday, streak is broken
    if (uniqueSorted[0] < yesterdayMidnight) {
      return 0;
    }

    let streak = 1;
    let current = uniqueSorted[0];

    for (let i = 1; i < uniqueSorted.length; i++) {
      const prev = uniqueSorted[i];
      const diff = current - prev;
      const oneDayMs = 24 * 60 * 60 * 1000;

      // Allow 1 hour tolerance for D.S.T adjustments
      if (diff >= oneDayMs - 3600000 && diff <= oneDayMs + 3600000) {
        streak++;
        current = prev;
      } else {
        break;
      }
    }

    return streak;
  };

  // Main calculations on filtered tasks list
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');
  const completedCount = completedTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Pie chart priority data calculations
  const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
  filteredTasks.forEach((t) => {
    const p = t.priority || 'medium';
    if (priorityCounts[p] !== undefined) {
      priorityCounts[p]++;
    }
  });

  const pieData = [
    { name: 'Urgent', value: priorityCounts.urgent, color: '#ef4444' },
    { name: 'High', value: priorityCounts.high, color: '#f97316' },
    { name: 'Medium', value: priorityCounts.medium, color: '#eab308' },
    { name: 'Low', value: priorityCounts.low, color: '#22c55e' },
  ].filter((item) => item.value > 0);

  // Overdue table data calculations
  const now = new Date();
  const overdueTasks = allTasks
    .filter((t) => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.deadline) < now))
    .map((t) => {
      const diffMs = now - new Date(t.deadline);
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return {
        ...t,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue) // Show oldest first (most overdue)
    .slice(0, 5);

  // Bottom summary calculations (from allTasks for consistency)
  const allCompleted = allTasks.filter((t) => t.status === 'completed' && t.completedAt && t.createdAt);

  // Busiest day calculation
  let busiestDayStr = 'N/A';
  if (allTasks.length > 0) {
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    allTasks.forEach((t) => {
      const dayIndex = new Date(t.createdAt).getDay();
      weekdayCounts[dayIndex]++;
    });
    const maxVal = Math.max(...weekdayCounts);
    const busiestDayIndex = weekdayCounts.indexOf(maxVal);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    busiestDayStr = maxVal > 0 ? dayNames[busiestDayIndex] : 'N/A';
  }

  // Avg completion time
  let avgTimeStr = 'N/A';
  if (allCompleted.length > 0) {
    const totalMs = allCompleted.reduce(
      (sum, t) => sum + (new Date(t.completedAt) - new Date(t.createdAt)),
      0
    );
    const avgMs = totalMs / allCompleted.length;
    const avgDays = avgMs / (1000 * 60 * 60 * 24);
    if (avgDays >= 1) {
      avgTimeStr = `${avgDays.toFixed(1)} days`;
    } else {
      const avgHours = avgMs / (1000 * 60 * 60);
      avgTimeStr = `${avgHours.toFixed(1)} hours`;
    }
  }

  // Fastest completion time
  let fastestStr = 'N/A';
  if (allCompleted.length > 0) {
    const durations = allCompleted.map((t) => new Date(t.completedAt) - new Date(t.createdAt));
    const minMs = Math.min(...durations);
    const minMins = Math.round(minMs / (1000 * 60));
    if (minMins < 60) {
      fastestStr = `${minMins} mins`;
    } else {
      const minHours = minMs / (1000 * 60 * 60);
      fastestStr = `${minHours.toFixed(1)} hours`;
    }
  }

  const streakDays = calcStreak(allTasks);

  // Skeleton shimmer view during load
  const AnalyticsSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2 w-1/3 animate-pulse">
          <div className="h-7 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
        <div className="h-9 bg-slate-200 rounded w-28 animate-pulse"></div>
      </div>
      
      {/* 2 columns of skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={5} />
      </div>
      
      {/* Created vs Completed chart skeleton */}
      <SkeletonCard lines={5} />
      
      {/* Avg Completion Time & Overdue list skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={5} />
      </div>

      {/* KPI summaries bottom cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <SkeletonCard key={n} lines={2} />
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  const weeklyChartData = buildWeeklyData(allTasks);
  const avgPriorityTimeData = buildAvgTimeData(allTasks);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Productivity Analytics
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Track your performance and sprint completions.
          </p>
        </div>

        {/* Time range selector dropdown */}
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all hover:bg-slate-50"
          >
            <option value="this-week">This Week</option>
            <option value="last-30">Last 30 Days</option>
            <option value="all-time">All Time</option>
          </select>
        </div>
      </div>

      {/* Row 1: Completion rate Gauge & Priority donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Radial Completion Gauge */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col items-center relative min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-800 self-start mb-2">Completion Rate</h3>
          
          <div className="relative h-[180px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="80%"
                outerRadius="105%"
                barSize={16}
                data={[{ value: completionRate }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: '#f1f5f9' }}
                  dataKey="value"
                  cornerRadius={8}
                  fill="#6366f1"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            
            {/* Centered Big Percentage Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-indigo-600 font-mono">
                {completionRate}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Completed
              </span>
            </div>
          </div>

          <p className="text-xs font-medium text-slate-500 mt-4 text-center">
            {completedCount} of {totalTasks} tasks completed in the selected timeframe.
          </p>
        </div>

        {/* Card 2: Priority Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Priority Breakdown</h3>
          
          {pieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-xs">
              No tasks found. Create tasks to view priority data.
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="h-[180px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value, name, props) => {
                        const total = pieData.reduce((sum, item) => sum + item.value, 0);
                        const pct = Math.round((value / total) * 100);
                        return [`${value} tasks (${pct}%)`, name];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with explicit counts */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-slate-600 mt-2">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}:</span>
                    <span className="font-bold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Created vs Completed AreaChart (Last 7 Days) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Tasks Created vs Completed</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Last 7 Days Trend
          </span>
        </div>
        <div className="h-[280px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyChartData} margin={{ left: -15, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="created"
                name="Created"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={0.6}
                fill="url(#colorCreated)"
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={0.6}
                fill="url(#colorCompleted)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Avg Completion Time & Overdue Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Avg Completion Time BarChart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between min-h-[320px]">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Avg Completion Time per Priority</h3>
          
          <div className="h-[230px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgPriorityTimeData} margin={{ left: -15, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="priority" tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} hours`, 'Average Time']}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Bar dataKey="avgHours" radius={[4, 4, 0, 0]} maxBarSize={45}>
                  {avgPriorityTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Most Overdue Tasks Table */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col min-h-[320px] overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
            <span>Most Overdue Tasks</span>
          </h3>

          {overdueTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
              <span className="text-3xl mb-1">🎉</span>
              <p className="text-xs font-bold text-emerald-600">No overdue tasks!</p>
              <p className="text-[10px] text-slate-400 mt-0.5">You are fully up to date with deadlines.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 pb-2 font-semibold">Task</th>
                    <th className="py-2.5 pb-2 font-semibold">Priority</th>
                    <th className="py-2.5 pb-2 font-semibold">Deadline</th>
                    <th className="py-2.5 pb-2 font-semibold text-right">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {overdueTasks.map((task) => {
                    const isLongOverdue = task.daysOverdue > 7;
                    const rowBg = isLongOverdue ? 'bg-red-50/50 hover:bg-red-50' : 'bg-orange-50/30 hover:bg-orange-50/70';
                    return (
                      <tr key={task._id} className={`transition-colors ${rowBg}`}>
                        <td className="py-3 px-2 font-bold text-slate-900 truncate max-w-[140px]" title={task.title}>
                          {task.title}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
                            task.priority === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-400 font-mono">
                          {new Date(task.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3 px-2 text-right font-extrabold text-red-600 font-mono">
                          {task.daysOverdue}d
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats Row (Bottom) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Avg Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Avg Time
            </span>
            <span className="text-sm font-extrabold text-slate-800 block">
              {avgTimeStr}
            </span>
          </div>
        </div>

        {/* Card 2: Fastest Completion */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 fill-amber-50" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Fastest Task
            </span>
            <span className="text-sm font-extrabold text-slate-800 block">
              {fastestStr}
            </span>
          </div>
        </div>

        {/* Card 3: Busiest Day */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Busiest Day
            </span>
            <span className="text-sm font-extrabold text-slate-800 block truncate max-w-[120px]">
              {busiestDayStr}
            </span>
          </div>
        </div>

        {/* Card 4: Streak */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
            streakDays > 0 ? 'bg-orange-50 text-orange-600 animate-pulse' : 'bg-slate-50 text-slate-400'
          }`}>
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Daily Streak
            </span>
            <span className="text-sm font-extrabold text-slate-800 block">
              {streakDays} {streakDays === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
