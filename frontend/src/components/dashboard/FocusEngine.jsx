import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Zap, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const FocusEngine = ({ tasks, onTaskComplete }) => {
  const [activeTask, setActiveTask] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1500); // default 25 mins
  const [isRunning, setIsRunning] = useState(false);
  const [peakHours, setPeakHours] = useState('2:00 PM - 4:00 PM'); // default backup representation
  const intervalRef = useRef(null);

  const calculatePeakEnergyHours = useCallback((historyData) => {
    if (!historyData || historyData.length === 0) {
      setPeakHours('Not enough data (Complete a session!)');
      return;
    }
    const hours = historyData.map(h => new Date(h.timestamp).getHours());
    // Find most frequent hour
    const counts = {};
    let maxHour = hours[0];
    let maxCount = 1;
    for (const hr of hours) {
      counts[hr] = (counts[hr] || 0) + 1;
      if (counts[hr] > maxCount) {
        maxCount = counts[hr];
        maxHour = hr;
      }
    }
    const startHour = maxHour;
    const endHour = (maxHour + 2) % 24;
    const formatHr = (h) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH}:00 ${ampm}`;
    };
    setPeakHours(`${formatHr(startHour)} - ${formatHr(endHour)}`);
  }, []);

  // Load history and pick the best task on mount or task list change
  useEffect(() => {
    // Load historical sessions from local storage
    const savedHistory = JSON.parse(localStorage.getItem('deadlineai_focus_history') || '[]');
    calculatePeakEnergyHours(savedHistory);

    // Pick task automatically
    if (tasks && tasks.length > 0) {
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      if (activeTasks.length > 0) {
        // Algorithm: sort by score (urgency * energy) descending, then by estimate
        const sorted = [...activeTasks].sort((a, b) => {
          const scoreA = ({ urgent: 4, high: 3, medium: 2, low: 1 }[a.priority] || 2) * ({ high: 3, medium: 2, low: 1 }[a.energy] || 2);
          const scoreB = ({ urgent: 4, high: 3, medium: 2, low: 1 }[b.priority] || 2) * ({ high: 3, medium: 2, low: 1 }[b.energy] || 2);
          if (scoreB !== scoreA) return scoreB - scoreA;
          return (a.daysUntilDeadline || 10) - (b.daysUntilDeadline || 10); // sooner first
        });
        
        const bestTask = sorted[0];
        setActiveTask(bestTask);
        
        // Lock timer length based on cognitive effort
        // High effort: 50 mins (3000s), Medium: 35 mins (2100s), Low: 20 mins (1200s)
        const effort = bestTask.cognitiveEffort || 'medium';
        const seconds = effort === 'high' ? 3000 : effort === 'medium' ? 2100 : 1200;
        setTimeLeft(seconds);
      }
    }
  }, [tasks, calculatePeakEnergyHours]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    
    // Save to local storage history
    const savedHistory = JSON.parse(localStorage.getItem('deadlineai_focus_history') || '[]');
    const newSession = {
      id: Math.random().toString(36).substring(7),
      taskTitle: activeTask ? activeTask.title : 'General Focus',
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [newSession, ...savedHistory];
    localStorage.setItem('deadlineai_focus_history', JSON.stringify(updatedHistory));
    calculatePeakEnergyHours(updatedHistory);

    toast.success('🎉 Focus Session Completed! Take a well-earned break.');
    
    // Trigger callback if provided
    if (onTaskComplete && activeTask) {
      onTaskComplete(activeTask._id);
    }
  }, [activeTask, onTaskComplete, calculatePeakEnergyHours]);

  // Tick down timer
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleSessionComplete]);

  const handleToggleStart = () => {
    if (!activeTask) {
      toast.error('No tasks available for focus engine.');
      return;
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (activeTask) {
      const effort = activeTask.cognitiveEffort || 'medium';
      const seconds = effort === 'high' ? 3000 : effort === 'medium' ? 2100 : 1200;
      setTimeLeft(seconds);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
      {/* Decorative gradient glowing backdrop */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Title */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Zap className="h-4 w-4 fill-indigo-100" />
            </span>
            <span>Focus Engine</span>
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold py-1 px-2.5 rounded-full border border-slate-200/50 flex items-center gap-1 font-mono">
            <Clock className="h-3 w-3" />
            <span>Peak: {peakHours}</span>
          </span>
        </div>

        {activeTask ? (
          <div className="space-y-4">
            {/* Task Info Nudge */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Engaged Task</span>
                <span className="h-1 w-1 bg-slate-300 rounded-full" />
                <span className="text-indigo-600">Locked Duration</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{activeTask.title}</h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-50 text-amber-700 text-[10px] py-0.5 px-2 rounded-full font-medium border border-amber-100 capitalize">
                  ⚡ {activeTask.priority}
                </span>
                <span className="bg-fuchsia-50 text-fuchsia-700 text-[10px] py-0.5 px-2 rounded-full font-medium border border-fuchsia-100 capitalize">
                  🧠 {activeTask.cognitiveEffort || 'medium'} effort
                </span>
              </div>
            </div>

            {/* Countdown Session Clock */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className={`relative flex items-center justify-center w-36 h-36 rounded-full border-4 ${
                isRunning ? 'border-indigo-600 shadow-lg shadow-indigo-500/10' : 'border-slate-100'
              } transition-all duration-300`}>
                {/* Internal pulse animation when running */}
                {isRunning && (
                  <div className="absolute inset-0.5 bg-indigo-50/30 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                )}
                <div className="text-center z-10">
                  <span className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    {formatTime(timeLeft)}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {isRunning ? 'focusing' : 'paused'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-500 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Backlog Cleared!</h4>
            <p className="text-xs text-slate-500 max-w-[200px] mt-1 leading-relaxed">
              No pending tasks to lock in. Add new tasks to activate the Focus Engine.
            </p>
          </div>
        )}
      </div>

      {activeTask && (
        <div className="flex items-center gap-2 mt-4 border-t border-slate-50 pt-4">
          <button
            onClick={handleToggleStart}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-semibold text-xs text-white shadow-md active:scale-95 transition-all ${
              isRunning 
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10 hover:shadow-amber-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10 hover:shadow-indigo-500/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-white" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Start Session</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleReset}
            title="Reset Timer"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FocusEngine;
