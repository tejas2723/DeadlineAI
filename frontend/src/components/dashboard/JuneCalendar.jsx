import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Sparkles, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const JuneCalendar = ({ tasks }) => {
  const [selectedDay, setSelectedDay] = useState(25); // default "today" (June 25, 2026)
  const [scheduleBlocks, setScheduleBlocks] = useState({});
  const [isScheduling, setIsScheduling] = useState(false);

  // Initialize schedule blocks from LocalStorage or empty object
  useEffect(() => {
    const savedBlocks = JSON.parse(localStorage.getItem('deadlineai_calendar_blocks') || '{}');
    setScheduleBlocks(savedBlocks);
  }, []);

  const daysInJune = 30;

  // Map deadlines to calendar days
  const getTasksForDay = (dayNum) => {
    if (!tasks) return [];
    return tasks.filter(task => {
      if (!task.deadline || task.status === 'completed') return false;
      const d = new Date(task.deadline);
      return d.getFullYear() === 2026 && d.getMonth() === 5 && d.getDate() === dayNum; // 5 is June
    });
  };

  const handleDayClick = (dayNum) => {
    setSelectedDay(dayNum);
  };

  // AI Auto-Scheduler Algorithm
  const handleAutoSchedule = () => {
    if (!tasks || tasks.length === 0) {
      toast.error('No active tasks available to auto-schedule.');
      return;
    }

    setIsScheduling(true);

    setTimeout(() => {
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      if (activeTasks.length === 0) {
        toast.error('All tasks are already completed!');
        setIsScheduling(false);
        return;
      }

      // Sort by urgency/priority
      const sorted = [...activeTasks].sort((a, b) => {
        const scoreA = ({ urgent: 4, high: 3, medium: 2, low: 1 }[a.priority] || 2);
        const scoreB = ({ urgent: 4, high: 3, medium: 2, low: 1 }[b.priority] || 2);
        return scoreB - scoreA;
      });

      // Free blocks to allocate (e.g. 10 AM, 12 PM, 2 PM, 4 PM)
      const freeSlots = ['10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM'];
      const allocated = [];

      for (let i = 0; i < Math.min(sorted.length, freeSlots.length); i++) {
        allocated.push({
          time: freeSlots[i],
          taskTitle: sorted[i].title,
          isAI: true
        });
      }

      const updatedBlocks = {
        ...scheduleBlocks,
        [selectedDay]: allocated
      };

      setScheduleBlocks(updatedBlocks);
      localStorage.setItem('deadlineai_calendar_blocks', JSON.stringify(updatedBlocks));
      setIsScheduling(false);

      // Flash custom message identifying the auto-scheduled 2 PM block
      const pitchDeckSchedule = allocated.find(b => b.time === '02:00 PM');
      if (pitchDeckSchedule) {
        toast.success(`AI Scheduling Success! Auto-scheduled: "${pitchDeckSchedule.taskTitle}" at 2:00 PM.`);
      } else {
        toast.success('AI Scheduling completed for selected day!');
      }
    }, 800);
  };

  const clearSchedule = () => {
    const updatedBlocks = { ...scheduleBlocks };
    delete updatedBlocks[selectedDay];
    setScheduleBlocks(updatedBlocks);
    localStorage.setItem('deadlineai_calendar_blocks', JSON.stringify(updatedBlocks));
    toast.success('Schedule cleared.');
  };

  const selectedDayBlocks = scheduleBlocks[selectedDay] || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Calendar Grid Section */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <CalendarIcon className="h-4 w-4" />
            </span>
            <span className="text-md font-bold text-slate-900">June 2026</span>
          </div>
          <div className="flex gap-1">
            <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"><ChevronLeft className="h-4 w-4" /></button>
            <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Calendar day grid */}
          {Array.from({ length: daysInJune }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayTasks = getTasksForDay(dayNum);
            const hasDeadlines = dayTasks.length > 0;
            const isToday = dayNum === 25;
            const isSelected = dayNum === selectedDay;

            return (
              <button
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                type="button"
                className={`relative h-10 w-full rounded-xl flex flex-col items-center justify-center border font-medium text-xs transition-all ${
                  isSelected 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/10 font-bold scale-105' 
                    : isToday 
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-600 font-bold'
                    : 'bg-white border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-100'
                }`}
              >
                <span>{dayNum}</span>
                {/* Event indicator dot */}
                {hasDeadlines && (
                  <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-rose-500 animate-pulse'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Schedule Section */}
      <div className="border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Schedule: June {selectedDay}, 2026
            </h4>
            {selectedDayBlocks.length > 0 && (
              <button onClick={clearSchedule} className="text-[10px] font-semibold text-red-500 hover:underline">
                Clear
              </button>
            )}
          </div>

          {/* Time blocks listing */}
          <div className="space-y-2.5">
            {selectedDayBlocks.length > 0 ? (
              selectedDayBlocks.map((block, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <span className="text-[10px] font-bold text-slate-400 w-16 font-mono shrink-0">
                    {block.time}
                  </span>
                  <div className={`flex-1 p-2.5 rounded-xl border flex items-center justify-between min-w-0 ${
                    block.isAI 
                      ? 'bg-indigo-50/40 border-indigo-100/50 text-indigo-950' 
                      : 'bg-slate-50/50 border-slate-100 text-slate-800'
                  }`}>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight">{block.taskTitle}</p>
                      {block.isAI && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 py-0.5 px-1 rounded mt-1 uppercase tracking-widest">
                          <Sparkles className="h-2 w-2 fill-indigo-100 animate-pulse" />
                          <span>AI block</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-4">
                <Clock className="h-6 w-6 text-slate-300 mb-1" />
                <p className="text-xs font-semibold text-slate-700">No scheduled blocks</p>
                <p className="text-[10px] text-slate-400 mt-0.5 max-w-[150px]">
                  Use AI Auto-Scheduling to optimize free blocks.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Action Trigger */}
        <div className="pt-4 mt-4 border-t border-slate-50">
          <button
            onClick={handleAutoSchedule}
            disabled={isScheduling}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-850 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 fill-indigo-500/30 animate-pulse" />
            <span>{isScheduling ? 'AI Auto-Scheduling...' : 'AI Auto-Schedule Day'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default JuneCalendar;
