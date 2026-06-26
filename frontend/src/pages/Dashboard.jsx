import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import StatsCards from '../components/dashboard/StatsCards';
import ProgressChart from '../components/dashboard/ProgressChart';
import DeadlineTimeline from '../components/dashboard/DeadlineTimeline';
import AIPriorityPanel from '../components/ai/AIPriorityPanel';
import SkeletonCard from '../components/ui/SkeletonCard';

// Import New Features Components
import JuneCalendar from '../components/dashboard/JuneCalendar';
import FocusEngine from '../components/dashboard/FocusEngine';
import HabitTracker from '../components/dashboard/HabitTracker';
import VoiceOrb from '../components/dashboard/VoiceOrb';

import { Sparkles, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProposal, setShowProposal] = useState(true);

  // Fetch stats and tasks concurrently
  const fetchDashboardData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        api.get('/tasks/stats'),
        api.get('/tasks?sort=deadline&limit=10&status!=completed'), // Fetch urgent tasks
      ]);
      setStats(statsRes.data);
      setTasks(tasksRes.data.tasks || []);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleConfirmProposal = () => {
    setShowProposal(false);
    toast.success('Action confirmed! Scheduled "Prepare Slides" for tomorrow at 10:00 AM.');
  };

  // Time-based user greeting helper
  const getGreeting = (name) => {
    const hr = new Date().getHours();
    let greet = 'evening';
    if (hr >= 5 && hr < 12) greet = 'morning';
    else if (hr >= 12 && hr < 17) greet = 'afternoon';
    return `Good ${greet}, ${name || 'Builder'}! 👋`;
  };

  // Format date helper: e.g. "Thursday, June 25, 2026"
  const getFormattedDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Skeleton loading view
  const DashboardSkeleton = () => (
    <div className="space-y-6">
      <div className="space-y-2 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/5"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <SkeletonCard key={n} lines={2} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-pulse">
        <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200/50"></div>
        <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200/50"></div>
      </div>
    </div>
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Find urgent pending task for warnings
  const pendingUrgentTask = tasks.find(t => t.priority === 'urgent' && t.status !== 'completed');

  return (
    <div className="space-y-6">
      
      {/* Welcome Greeting Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {getGreeting(user?.name)}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {getFormattedDate()}
          </p>
        </div>
      </div>

      {/* AI Recommendation Nudge & Autonomous Planner Banner */}
      <div className="bg-gradient-to-r from-indigo-50/70 to-indigo-100/30 border border-indigo-100 rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start gap-3">
          <span className="p-2 bg-indigo-600 rounded-xl text-white shrink-0 mt-0.5 shadow-md shadow-indigo-500/10">
            <Sparkles className="h-5 w-5 fill-indigo-200/50 animate-pulse" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
              <span>AI Advisor Insights</span>
              <span className="text-[8px] bg-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border border-indigo-200/30">Nudge</span>
            </h4>
            <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed max-w-2xl">
              Focus Engine telemetry logs reveal peak output between 2:00 PM and 4:00 PM based on past cycles. Schedule your high-energy tasks in that block to maximize completion rates!
            </p>
          </div>
        </div>
        
        {/* Autonomous Task Planner Proposal */}
        {showProposal && (
          <div className="bg-white border border-indigo-100/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-[300px] shadow-sm shrink-0 border-l-4 border-l-indigo-600 animate-fade-in">
            <div className="min-w-0">
              <span className="text-[8px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded uppercase tracking-widest border border-indigo-100/50">Autonomous Plan</span>
              <p className="text-xs font-semibold text-slate-800 mt-1 truncate">Schedule "Prepare Slides" for tomorrow 10 AM?</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button 
                onClick={handleConfirmProposal} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors active:scale-95"
              >
                Confirm
              </button>
              <button 
                onClick={() => setShowProposal(false)} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors active:scale-95"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Row */}
      {stats && <StatsCards stats={stats} />}

      {/* Grid: Calendar & Habit streaks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <JuneCalendar tasks={tasks} />
        </div>
        <div>
          <HabitTracker />
        </div>
      </div>

      {/* Grid: Focus Engine & Voice Mode / Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FocusEngine tasks={tasks} onTaskComplete={fetchDashboardData} />
        </div>
        
        <div className="lg:col-span-1">
          <VoiceOrb tasks={tasks} />
        </div>

        {/* Context-Aware Reminders */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                <AlertCircle className="h-4 w-4" />
              </span>
              <span>Context Reminders</span>
            </h3>

            <div className="space-y-3 mt-4">
              {/* Reminder 1: Deadline Urgency */}
              <div className="flex gap-3 items-start">
                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0 border border-rose-100">
                  <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Deadline Urgency</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-normal">
                    {pendingUrgentTask 
                      ? `"${pendingUrgentTask.title}" is urgent and due soon. Do not delay!` 
                      : '"Sprint Tasks" are highly urgent. Focus on backlog items.'}
                  </p>
                </div>
              </div>

              {/* Reminder 2: Gaps */}
              <div className="flex gap-3 items-start">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 border border-indigo-100">
                  <Clock className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Schedule Gaps</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-normal">
                    2 hours of free slots detected this afternoon. Tap "Auto-Schedule" to allocate.
                  </p>
                </div>
              </div>

              {/* Reminder 3: Streaks at Risk */}
              <div className="flex gap-3 items-start">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0 border border-amber-100">
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Habit Streaks at Risk</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-normal">
                    Your 6-day streak for "Code sprint session" is at risk. Mark it complete before midnight!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      {stats && (
        <ProgressChart
          weeklyData={stats.weeklyData || []}
          priorityData={tasks || []}
        />
      )}

      {/* AI prioritizations & Timeline Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AIPriorityPanel />
        <DeadlineTimeline tasks={tasks} />
      </div>
    </div>
  );
};

export default Dashboard;
