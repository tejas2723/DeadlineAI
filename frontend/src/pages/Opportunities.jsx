import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  Briefcase, 
  Search, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  BookOpen, 
  Users, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  AlertCircle, 
  Loader2, 
  FileCheck,
  Award,
  BookMarked
} from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Opportunities = () => {
  const { user, updateUser } = useAuth();
  
  // Profile form state
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [careerGoals, setCareerGoals] = useState('');
  const [experience, setExperience] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [currentProjects, setCurrentProjects] = useState('');
  
  // Page states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedOpportunityId, setExpandedOpportunityId] = useState(null);
  const [appPrepTab, setAppPrepTab] = useState('cover-letter'); // 'cover-letter', 'elevator-pitch', 'resume', 'interview'

  // Initialize form from user context
  useEffect(() => {
    if (user && user.careerProfile) {
      const profile = user.careerProfile;
      setSkills(profile.skills || []);
      setCareerGoals(profile.careerGoals || '');
      setExperience(profile.experience || '');
      setResumeText(profile.resumeText || '');
      setGithubUrl(profile.githubUrl || '');
      setLinkedinUrl(profile.linkedinUrl || '');
      setCurrentProjects(profile.currentProjects || '');
    }
  }, [user]);

  // Load matching opportunities on mount
  useEffect(() => {
    handleScanOpportunities(true); // silent scan on load
  }, []);

  const handleAddSkill = (e) => {
    e.preventDefault();
    const clean = skillInput.trim();
    if (clean && !skills.includes(clean)) {
      setSkills([...skills, clean]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', {
        skills,
        careerGoals,
        experience,
        resumeText,
        githubUrl,
        linkedinUrl,
        currentProjects
      });
      updateUser(res.data.user);
      toast.success('🚀 Career profile updated successfully!');
      // Trigger new scan automatically
      handleScanOpportunities(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleScanOpportunities = async (silent = false) => {
    if (!silent) setIsScanning(true);
    try {
      const res = await api.post('/ai/detect-opportunities');
      setResults(res.data);
      if (!silent) {
        toast.success('✨ Opportunity analysis complete! Found matching roles.');
      }
      // Expand first opportunity by default
      if (res.data.opportunities && res.data.opportunities.length > 0) {
        setExpandedOpportunityId(res.data.opportunities[0].id);
      }
    } catch (err) {
      if (!silent) {
        toast.error('Failed to run opportunity scanner. Using cached matches.');
      }
    } finally {
      if (!silent) setIsScanning(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedOpportunityId(expandedOpportunityId === id ? null : id);
  };

  const getOpportunityIcon = (type) => {
    switch (type) {
      case 'internship': return <Briefcase className="h-5 w-5 text-indigo-600" />;
      case 'hackathon': return <Sparkles className="h-5 w-5 text-amber-600" />;
      case 'open-source': return <GithubIcon className="h-5 w-5 text-slate-700" />;
      case 'scholarship': return <Award className="h-5 w-5 text-emerald-600" />;
      default: return <BookMarked className="h-5 w-5 text-fuchsia-600" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 80) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    return 'text-amber-600 bg-amber-50 border-amber-100';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-16">
      {/* Premium Gradient Hero Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 md:p-10 shadow-lg text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide text-indigo-200">
              <Sparkles className="h-3 w-3 fill-indigo-200" />
              AI-Powered Assistant
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Career Opportunity Detector
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Unlock personalized internship placements, tech hackathons, open-source SIG groups, and scholarship channels matching your profile details and calendar milestones.
            </p>
          </div>
          
          <button
            onClick={() => handleScanOpportunities(false)}
            disabled={isScanning}
            className="self-start md:self-center flex items-center justify-center gap-2 py-3 px-6 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
                <span>Scanning Ecosystem...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5 text-slate-900" />
                <span>Scan Opportunities</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Weekly Digest summary banner if loaded */}
      {results && results.weeklyDigest && (
        <div className="bg-gradient-to-r from-indigo-50/70 to-fuchsia-50/70 border border-indigo-100/50 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-start">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/10">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Weekly AI Digest & Insights
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {results.weeklyDigest.summary}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 pt-1 text-[11px] font-medium text-indigo-700">
              {results.weeklyDigest.insights.map((insight, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full" />
                  {insight}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Career Profile Configurator (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-50 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                Career Profile
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Keep your profile detailed to allow precise AI matching.
              </p>
            </div>

            {/* Career Goals */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Career Goals</label>
              <input
                type="text"
                placeholder="e.g. DevOps Internship, Frontend Engineer"
                value={careerGoals}
                onChange={(e) => setCareerGoals(e.target.value)}
                className="w-full text-sm py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Skills Tag Management */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Skills & Tech Stack</label>
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Docker, FastAPI, React"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-1 text-sm py-2 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="py-2 px-4 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-all active:scale-95"
                >
                  Add
                </button>
              </form>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {skills.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">No skills listed yet.</span>
                ) : (
                  skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                      onClick={() => handleRemoveSkill(skill)}
                      title="Click to remove"
                    >
                      {skill}
                      <span className="text-slate-400 font-bold hover:text-slate-600">×</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Experience & Projects</label>
              <textarea
                placeholder="List key projects, tools, or past internships..."
                rows={3}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full text-sm py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Current Projects Context */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Academic Projects</label>
              <textarea
                placeholder="Mention what you are currently building..."
                rows={2}
                value={currentProjects}
                onChange={(e) => setCurrentProjects(e.target.value)}
                className="w-full text-sm py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm text-slate-700 border-t border-slate-50 pt-4">
                <GithubIcon className="h-4 w-4 text-slate-500" />
                <input
                  type="url"
                  placeholder="GitHub Profile URL"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="flex-1 text-xs py-2 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <LinkedinIcon className="h-4 w-4 text-indigo-500" />
                <input
                  type="url"
                  placeholder="LinkedIn Profile URL"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="flex-1 text-xs py-2 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Raw Resume Text */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Paste Resume Contents</label>
              <textarea
                placeholder="Copy and paste text from your CV for AI deep parsing..."
                rows={5}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-mono"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="w-full flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Updating profile...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-white" />
                  <span>Save Career Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Opportunity Listings & Forecast (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header section with counts */}
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
              <span>Matching Opportunities</span>
              <span className="py-0.5 px-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-full border border-slate-200/50 font-mono">
                {results?.opportunities?.length || 0}
              </span>
            </h3>
          </div>

          {/* Opportunity Stack */}
          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">Analyzing Career Fit...</h4>
                <p className="text-xs text-slate-500 max-w-[280px] mt-1 leading-relaxed">
                  Parsing skills, resume text, and projects list to scan internships and tech hackathons.
                </p>
              </div>
            </div>
          ) : results?.opportunities && results.opportunities.length > 0 ? (
            <div className="space-y-4">
              {results.opportunities.map((opp) => {
                const isExpanded = expandedOpportunityId === opp.id;
                return (
                  <div 
                    key={opp.id} 
                    className={`bg-white rounded-2xl border transition-all ${
                      isExpanded ? 'border-indigo-200/60 shadow-md ring-2 ring-indigo-500/5' : 'border-slate-100 shadow-sm hover:border-slate-200'
                    } overflow-hidden`}
                  >
                    {/* Header Banner */}
                    <div 
                      onClick={() => toggleExpand(opp.id)}
                      className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex gap-3.5 items-start">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          {getOpportunityIcon(opp.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{opp.organization}</span>
                            <span className="h-1 w-1 bg-slate-300 rounded-full" />
                            <span className="text-[10px] bg-slate-50 text-slate-500 font-semibold py-0.5 px-2 rounded-full border border-slate-200 capitalize">
                              {opp.type}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 leading-snug">{opp.title}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium text-rose-600">{opp.deadlineText}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right score indicator */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className={`inline-flex items-center gap-1 font-bold text-xs py-1 px-3.5 rounded-full border capitalize font-mono ${getScoreColor(opp.matchScore)}`}>
                          Fit: {opp.matchScore}%
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Detailed Analysis (Expanded view) */}
                    {isExpanded && (
                      <div className="border-t border-slate-50 p-6 bg-slate-50/50 space-y-6">
                        
                        {/* Two Columns inside: Match Factors & Gaps */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Match Factors Breakdown */}
                          <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-sm">
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2.5">
                              <TrendingUp className="h-4 w-4 text-indigo-600" />
                              Match Factors Weight Breakdown
                            </h5>
                            <div className="space-y-3">
                              {Object.entries(opp.matchFactors || {}).map(([key, val]) => {
                                const formattedKey = key.replace(/([A-Z])/g, ' $1');
                                return (
                                  <div key={key} className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 capitalize">
                                      <span>{formattedKey}</span>
                                      <span className="font-mono">{val}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-600 rounded-full" 
                                        style={{ width: `${val}%` }} 
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Gap Analysis & Roadmaps */}
                          <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-sm flex flex-col justify-between">
                            <div>
                              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2.5">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                Resume Gap Analysis
                              </h5>
                              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                {opp.resumeGapAnalysis}
                              </p>
                              {opp.teamFinderRecommendation && (
                                <div className="mt-3.5 p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-indigo-700 text-[11px] leading-relaxed flex gap-2">
                                  <Users className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                                  <div>
                                    <strong className="font-bold">Team Advice: </strong>
                                    {opp.teamFinderRecommendation}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Learning Recommendations Roadmap */}
                            {opp.learningRecommendations?.roadmap && (
                              <div className="pt-4 border-t border-slate-50 mt-4 space-y-2">
                                <h6 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                                  Suggested Study Roadmap
                                </h6>
                                <div className="space-y-2">
                                  {opp.learningRecommendations.roadmap.map((rm, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                                      <div className="space-y-0.5">
                                        <span className="font-semibold text-slate-700">{rm.skill}</span>
                                        <p className="text-[10px] text-slate-500 leading-snug">{rm.description}</p>
                                      </div>
                                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold py-0.5 px-2 rounded-full border border-slate-200 shrink-0 font-mono">
                                        ~{rm.estHours}h
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Why it matches bullet pointers */}
                        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-2 shadow-sm">
                          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            Why It Matches Your Signals
                          </h5>
                          <ul className="space-y-1.5 pt-2 text-xs text-slate-600">
                            {opp.whyItMatches.map((reason, idx) => (
                              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Auto Application Prep Center */}
                        {opp.applicationPrep && (
                          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                            <div className="bg-slate-50 border-b border-slate-100 p-4">
                              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <FileCheck className="h-4 w-4 text-indigo-600" />
                                Auto Application Preparation
                              </h5>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                AI has pre-drafted custom materials to expedite your application process.
                              </p>
                            </div>

                            {/* Tabs selector */}
                            <div className="flex border-b border-slate-100 text-xs font-semibold overflow-x-auto">
                              <button 
                                onClick={() => setAppPrepTab('cover-letter')}
                                className={`py-3 px-4 border-b-2 whitespace-nowrap ${
                                  appPrepTab === 'cover-letter' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Cover Letter
                              </button>
                              <button 
                                onClick={() => setAppPrepTab('elevator-pitch')}
                                className={`py-3 px-4 border-b-2 whitespace-nowrap ${
                                  appPrepTab === 'elevator-pitch' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Elevator Pitch
                              </button>
                              <button 
                                onClick={() => setAppPrepTab('resume')}
                                className={`py-3 px-4 border-b-2 whitespace-nowrap ${
                                  appPrepTab === 'resume' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Resume Tweaks
                              </button>
                              <button 
                                onClick={() => setAppPrepTab('interview')}
                                className={`py-3 px-4 border-b-2 whitespace-nowrap ${
                                  appPrepTab === 'interview' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Interview Checklist
                              </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-5">
                              {appPrepTab === 'cover-letter' && (
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tailored Draft</span>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(opp.applicationPrep.coverLetterDraft);
                                        toast.success('Copied cover letter to clipboard!');
                                      }}
                                      className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                                    >
                                      Copy Text
                                    </button>
                                  </div>
                                  <pre className="text-xs bg-slate-50 border border-slate-100 rounded-xl p-4 font-sans text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {opp.applicationPrep.coverLetterDraft}
                                  </pre>
                                </div>
                              )}

                              {appPrepTab === 'elevator-pitch' && (
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2-Sentence Elevator Pitch</span>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(opp.applicationPrep.elevatorPitch);
                                        toast.success('Copied pitch to clipboard!');
                                      }}
                                      className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                                    >
                                      Copy Text
                                    </button>
                                  </div>
                                  <p className="text-xs bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-700 italic leading-relaxed">
                                    "{opp.applicationPrep.elevatorPitch}"
                                  </p>
                                </div>
                              )}

                              {appPrepTab === 'resume' && (
                                <div className="space-y-3">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Add these Bullet Pointers to your CV</span>
                                  <ul className="space-y-2">
                                    {opp.applicationPrep.tailoredResumeBulletPoints.map((bp, idx) => (
                                      <li key={idx} className="text-xs bg-emerald-50/50 border border-emerald-100/50 text-emerald-800 rounded-xl p-3.5 leading-relaxed font-mono">
                                        + {bp}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {appPrepTab === 'interview' && (
                                <div className="space-y-3">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Preparation Tasks checklist</span>
                                  <div className="space-y-2">
                                    {opp.applicationPrep.interviewPrepChecklist.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                        <input 
                                          type="checkbox" 
                                          id={`check-${opp.id}-${idx}`}
                                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                                        />
                                        <label htmlFor={`check-${opp.id}-${idx}`} className="cursor-pointer font-medium select-none flex-1">
                                          {item}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Forecast footer */}
                        <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-4 flex justify-between">
                          <span>Forecast prediction: {opp.forecast}</span>
                          <span>ID: {opp.id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                <Search className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">No opportunities detected</h4>
                <p className="text-xs text-slate-500 max-w-[280px] mt-1 leading-relaxed">
                  Update your career profile, save, and hit the "Scan Opportunities" scanner to query matching listings.
                </p>
              </div>
            </div>
          )}

          {/* Upcoming Forecast Section */}
          {results && results.upcomingForecast && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Upcoming Opportunities & Forecast Timeline
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI predictions of seasonal applications based on historical schedules.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.upcomingForecast.map((forecast, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1 hover:bg-slate-50 transition-all">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                      {forecast.timeframe}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">{forecast.title}</h5>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {forecast.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Opportunities;
