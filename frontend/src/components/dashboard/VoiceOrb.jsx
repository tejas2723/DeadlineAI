import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceOrb = ({ tasks }) => {
  const [voiceState, setVoiceState] = useState('idle'); // 'idle', 'listening', 'processing', 'speaking'
  const [aiText, setAiText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      setSpeechSupported(true);
    }
  }, []);

  const triggerVoiceFlow = () => {
    if (voiceState !== 'idle') return;

    // 1. Listening
    setVoiceState('listening');
    setAiText('Listening...');
    
    // Simulate Listening for 2.5 seconds
    setTimeout(() => {
      // 2. Processing
      setVoiceState('processing');
      setAiText('Processing audio...');

      // Simulate Processing for 1.8 seconds
      setTimeout(() => {
        // 3. Formulate Speech Content
        setVoiceState('speaking');
        
        let speechMessage = "Hi Tejas! I've analyzed your sprint backlog. You have two urgent tasks due today and tomorrow. I recommend starting a focus session on your MVP tasks immediately while your energy levels are high. Let's get it done!";
        
        if (tasks && tasks.length > 0) {
          const urgentTask = tasks.find(t => t.priority === 'urgent' && t.status !== 'completed');
          if (urgentTask) {
            speechMessage = `Hi Tejas! Your urgent task, "${urgentTask.title}", requires attention. Let's tackle it now while your focus levels are high. I'll help you lock in a focus block.`;
          }
        }

        setAiText(speechMessage);

        // Speak the message using Web Speech API
        if (speechSupported) {
          // Cancel any ongoing speech first
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(speechMessage);
          
          // Try to select a nice male/female voice
          const voices = window.speechSynthesis.getVoices();
          const englishVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google'));
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
          utterance.rate = 1.05; // slightly faster
          
          utterance.onend = () => {
            setVoiceState('idle');
            setAiText('');
          };

          utterance.onerror = () => {
            setVoiceState('idle');
            setAiText('');
          };

          window.speechSynthesis.speak(utterance);
        } else {
          // Fallback if SpeechSynthesis is disabled or blocked
          setTimeout(() => {
            setVoiceState('idle');
            setAiText('');
            toast.success("Voice feedback complete!");
          }, 6000);
        }
      }, 1800);
    }, 2500);
  };

  const handleStopSpeech = () => {
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('idle');
    setAiText('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden h-full">
      {/* Background glow mapping to orb state */}
      <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none opacity-10 ${
        voiceState === 'listening' ? 'bg-rose-500' :
        voiceState === 'processing' ? 'bg-indigo-500' :
        voiceState === 'speaking' ? 'bg-emerald-500' :
        'bg-indigo-500'
      }`} />

      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 justify-center">
          <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
          <span>AI Voice Companion</span>
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
          {voiceState === 'idle' ? 'Tap orb to start voice flow' : voiceState}
        </p>
      </div>

      {/* Glow Animated Orb */}
      <button
        onClick={voiceState === 'speaking' ? handleStopSpeech : triggerVoiceFlow}
        type="button"
        className={`h-24 w-24 rounded-full flex items-center justify-center relative cursor-pointer outline-none focus:outline-none transition-all duration-500 active:scale-95 border-4 ${
          voiceState === 'listening' 
            ? 'bg-gradient-to-tr from-rose-500 to-pink-500 border-rose-100 shadow-lg shadow-rose-500/20 animate-pulse' 
            : voiceState === 'processing'
            ? 'bg-gradient-to-tr from-indigo-500 to-violet-500 border-indigo-100 shadow-lg shadow-indigo-500/20 animate-spin animate-duration-1000'
            : voiceState === 'speaking'
            ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 border-emerald-100 shadow-lg shadow-emerald-500/20 animate-bounce'
            : 'bg-gradient-to-tr from-indigo-600 to-indigo-700 border-indigo-100 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-105'
        }`}
      >
        <div className="absolute inset-2 bg-white/10 rounded-full blur-sm" />
        
        {voiceState === 'listening' ? (
          <Mic className="h-8 w-8 text-white animate-pulse" />
        ) : voiceState === 'processing' ? (
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        ) : voiceState === 'speaking' ? (
          <Volume2 className="h-8 w-8 text-white" />
        ) : (
          <Mic className="h-8 w-8 text-white" />
        )}
      </button>

      {/* Voice Assistant speech text bubble */}
      {aiText && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 max-w-[240px] text-[11px] font-medium text-slate-700 shadow-sm leading-relaxed animate-fade-in relative">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-50 border-t border-l border-slate-100 rotate-45" />
          <p>{aiText}</p>
          {voiceState === 'speaking' && (
            <button 
              onClick={handleStopSpeech} 
              className="text-[9px] text-red-500 font-bold hover:underline block mx-auto mt-2 uppercase tracking-wider"
            >
              Stop Listening
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceOrb;
