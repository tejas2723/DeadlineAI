import React, { useState, useEffect } from 'react';
import { Target, Award, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);

  // Load from LocalStorage or initialize defaults
  useEffect(() => {
    const defaultHabits = [
      { id: 'h1', name: 'Code sprint session', streak: 6, history: [true, true, true, true, true, true, false] },
      { id: 'h2', name: 'Update task backlog', streak: 3, history: [true, true, false, true, true, false, false] },
      { id: 'h3', name: 'Mindful focus break', streak: 5, history: [true, true, true, true, true, false, false] }
    ];

    const defaultGoals = [
      { id: 'g1', name: 'Finish Hackathon MVP', progress: 85, category: 'Product' },
      { id: 'g2', name: 'Google Cloud Run Deploy', progress: 100, category: 'Infrastructure' },
      { id: 'g3', name: 'Pitch deck slides preparation', progress: 40, category: 'Business' }
    ];

    const savedHabits = JSON.parse(localStorage.getItem('deadlineai_habits'));
    const savedGoals = JSON.parse(localStorage.getItem('deadlineai_goals'));

    if (savedHabits) {
      setHabits(savedHabits);
    } else {
      setHabits(defaultHabits);
      localStorage.setItem('deadlineai_habits', JSON.stringify(defaultHabits));
    }

    if (savedGoals) {
      setGoals(savedGoals);
    } else {
      setGoals(defaultGoals);
      localStorage.setItem('deadlineai_goals', JSON.stringify(defaultGoals));
    }
  }, []);

  const handleToggleDay = (habitId, dayIndex) => {
    const updated = habits.map(habit => {
      if (habit.id === habitId) {
        const historyCopy = [...habit.history];
        historyCopy[dayIndex] = !historyCopy[dayIndex];

        // If today is checked, calculate current streak starting from today backwards
        let streak = 0;
        for (let i = historyCopy.length - 1; i >= 0; i--) {
          if (historyCopy[i]) streak++;
          else break;
        }

        if (streak > habit.streak && historyCopy[dayIndex]) {
          toast.success(`🔥 Nice! Streak extended to ${streak} days for "${habit.name}"!`);
        }

        return { ...habit, history: historyCopy, streak };
      }
      return habit;
    });

    setHabits(updated);
    localStorage.setItem('deadlineai_habits', JSON.stringify(updated));
  };

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-6">
      
      {/* Active Goals Section */}
      <div className="space-y-4">
        <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
            <Target className="h-4 w-4" />
          </span>
          <span>Goal Progress</span>
        </h3>

        <div className="space-y-3">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{goal.name}</span>
                <span className="font-bold text-indigo-600 font-mono">{goal.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    goal.progress === 100 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
                      : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                  }`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{goal.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Habit Streak Section */}
      <div className="space-y-4 pt-4 border-t border-slate-50">
        <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
            <Award className="h-4 w-4" />
          </span>
          <span>Habit Tracker</span>
        </h3>

        <div className="space-y-4">
          {habits.map((habit) => (
            <div key={habit.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">{habit.name}</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-0.5">
                  🔥 {habit.streak}d Streak
                </span>
              </div>

              {/* Grid 7 days */}
              <div className="flex items-center justify-between gap-1.5">
                {daysOfWeek.map((dayLabel, dIdx) => {
                  const isChecked = habit.history[dIdx];
                  // Let's make the last element represents "Today" (Sunday on this static week)
                  const isToday = dIdx === 6;

                  return (
                    <button
                      key={dIdx}
                      onClick={() => handleToggleDay(habit.id, dIdx)}
                      type="button"
                      className={`h-7 w-7 rounded-lg flex items-center justify-center border transition-all ${
                        isChecked 
                          ? 'bg-indigo-600 border-indigo-600 text-white font-bold' 
                          : isToday 
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-600 font-bold' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? (
                        <Check className="h-3.5 w-3.5 stroke-[3px]" />
                      ) : (
                        <span className="text-[10px] uppercase font-bold">{dayLabel}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HabitTracker;
