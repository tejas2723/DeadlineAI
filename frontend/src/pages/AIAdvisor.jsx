import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, HelpCircle, ArrowRight, Lightbulb } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const AIAdvisor = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm **DeadlineAI**, your hackathon productivity coach. I've analyzed your task backlog. Ask me anything, or try some of these topics:\n- **Prioritize my tasks for today**\n- **Help me break down a complex task**\n- **Check if I'm at risk of missing any deadlines**",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const messagesEndRef = useRef(null);

  // Artificial sync delay to present clean database fetch transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setSyncing(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Suggestion chips configurations
  const SUGGESTION_CHIPS = [
    {
      label: 'Suggest a plan for today',
      query: 'Analyze my tasks and suggest an optimized hourly plan for today based on priority and deadlines.',
    },
    {
      label: 'Check deadline conflicts',
      query: 'Are there any upcoming tasks at risk of missing their deadlines? Highlight any bottlenecks.',
    },
    {
      label: 'Give me motivation',
      query: 'Give me a quick hackathon motivation boost based on my progress!',
    },
    {
      label: 'Help allocate work hours',
      query: 'How should I distribute my work hours today among my active tasks?',
    },
  ];

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Markdown parsing helper
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bullet points
      const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*');
      let cleanLine = isBullet ? line.trim().substring(1).trim() : line;

      // Bold formatting: **word**
      const parts = cleanLine.split('**');
      const formattedContent = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return (
            <strong key={pIdx} className="font-bold text-indigo-950">
              {part}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc pl-1 mb-1.5 text-slate-700 leading-relaxed text-sm">
            {formattedContent}
          </li>
        );
      }

      // Check if it's a heading like "### Title" or "1. Title"
      const isHeading = line.trim().startsWith('###') || /^\d+\.\s/.test(line.trim());
      if (isHeading) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1.5 flex items-center gap-1.5">
            {formattedContent}
          </h4>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-slate-700 leading-relaxed text-sm mb-2">
          {formattedContent}
        </p>
      );
    });
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessageId = `msg-${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Format chat history array for API context injection
    const formattedHistory = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const res = await api.post('/ai/chat', {
        message: query.trim(),
        history: formattedHistory,
      });

      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date(res.data.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.message || 'Sorry, I encountered an error while processing your request. Please try again.';
      toast.error(errorMsg);
      // Add error bubble
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (syncing) {
    return (
      <div className="flex h-[calc(100vh-7.5rem)] w-full flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" color="indigo" />
          <h3 className="text-sm font-bold text-slate-800 mt-2">Connecting to AI Advisor...</h3>
          <p className="text-xs text-slate-400">Syncing with task backlog and loading chat instance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-7.5rem)] h-auto min-h-[500px]">
      {/* Sidebar: Suggestions & Coach Info */}
      <div className="lg:col-span-4 flex flex-col gap-5 lg:h-full">
        {/* Profile Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                <Sparkles className="h-5 w-5 fill-indigo-100" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">DeadlineAI Coach</h3>
                <p className="text-xs text-green-500 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span>Syncing Backlog Context</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your AI coach continuously syncs with your tasks, priorities, and deadlines to provide optimized sprint schedules.
            </p>
          </div>

          <div className="border-t border-slate-50 mt-4 pt-3 flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <Lightbulb className="h-4 w-4 text-indigo-500" />
            <span>Updates dynamically as tasks are checked off.</span>
          </div>
        </div>

        {/* Suggestion Chips Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:flex-1 flex flex-col justify-between lg:overflow-y-auto">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              <span>Quick Prompts</span>
            </h4>
            <div className="space-y-2">
              {SUGGESTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.query)}
                  disabled={loading}
                  className="w-full text-left p-3 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-100 hover:text-indigo-700 transition-all flex items-center justify-between group active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                >
                  <span className="line-clamp-1">{chip.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-indigo-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 leading-relaxed">
            <strong>Pro Tip:</strong> You can ask detailed questions like: <em>"Which low priority task should I move to tomorrow to free up time for urgent tasks?"</em>
          </div>
        </div>
      </div>

      {/* Right Panel: Chat Terminal */}
      <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm h-[500px] lg:h-full overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Gemini Productivity Advisor</h3>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            Gemini 2.5 Pro
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50/30">
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  isAI ? 'self-start' : 'self-end flex-row-reverse ml-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    isAI ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'
                  }`}
                >
                  {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-slate-800 shadow-sm border ${
                    isAI
                      ? msg.isError
                        ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-white border-slate-100 rounded-tl-none'
                      : 'bg-indigo-600 text-white border-indigo-600 rounded-tr-none'
                  }`}
                >
                  {isAI ? (
                    <div className="space-y-1">{renderFormattedText(msg.content)}</div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <span
                    className={`block text-[9px] mt-1.5 text-right font-medium ${
                      isAI ? 'text-slate-400' : 'text-indigo-200'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* AI Loader */}
          {loading && (
            <div className="flex gap-3 max-w-[80%] self-start animate-pulse">
              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-indigo-600 font-semibold">Gemini is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask anything about your tasks, schedule, or priorities..."
              rows={1}
              disabled={loading}
              className="w-full pr-12 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-sm resize-none max-h-32 min-h-[44px] disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm hover:shadow-indigo-500/10 active:scale-95 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:scale-100"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium text-center mt-2">
            Context injected automatically: up to 10 most urgent active tasks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
