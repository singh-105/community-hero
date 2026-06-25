import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { Issue } from '../types';
import { IssueCard } from './IssueCard';
import { InteractiveMap } from './InteractiveMap';
import { CivicMap } from './CivicMap';
import { Map, Grid, Filter, ArrowUpRight, Flame, Trophy, Plus, HelpCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  onSelectIssue: (issue: Issue) => void;
  onNavigateToReport: () => void;
  onNavigateToDrives: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectIssue,
  onNavigateToReport,
  onNavigateToDrives,
}) => {
  const { issues, leaderboard, upvoteIssue } = useApp();
  const { user, signInWithGoogle } = useAuth();
  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : (user ? [user] : []);
  
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showMap, setShowMap] = useState(false);
  const [catFilter, setCatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'upvotes'>('upvotes');

  // Stats calculation
  const totalIssues = issues.length;
  const resolvedIssues = issues.filter(i => i.status === 'resolved').length;
  const inProgressIssues = issues.filter(i => i.status === 'in_progress' || i.status === 'assigned').length;

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'pothole', label: 'Potholes' },
    { id: 'garbage', label: 'Garbage Dumping' },
    { id: 'water_leak', label: 'Water Leak' },
    { id: 'streetlight', label: 'Streetlights' },
    { id: 'other', label: 'Others' },
  ];

  // Filtering logic
  let filteredIssues = issues.filter((issue) => {
    const catMatch = catFilter === 'all' || issue.category === catFilter;
    const statusMatch = statusFilter === 'all' || issue.status === statusFilter;
    return catMatch && statusMatch;
  });

  // Sorting logic
  filteredIssues.sort((a, b) => {
    if (sortBy === 'upvotes') {
      return (b.upvotes || 0) - (a.upvotes || 0);
    } else {
      const bTime = new Date(b.reportedAt || b.createdAt).getTime();
      const aTime = new Date(a.reportedAt || a.createdAt).getTime();
      return bTime - aTime;
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      
      {/* Banner / Google Welcome Card */}
      {!user && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-900 text-white shadow-lg relative overflow-hidden animate-fade-in">
          <div className="absolute right-0 bottom-0 opacity-15 translate-y-12 translate-x-12">
            <Trophy className="h-64 w-64" />
          </div>
          <div className="relative z-10 max-w-xl">
            <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white px-2.5 py-1 rounded-full shadow-xs">
              Bengaluru Ward Civic Initiative
            </span>
            <h2 className="mt-3 font-extrabold text-xl sm:text-2xl leading-tight">Empower Your Neighborhood with Community Hero</h2>
            <p className="mt-2 text-slate-200 text-xs sm:text-sm leading-relaxed">
              Report local infrastructure issues, coordinate with municipal corporations, join clean-up drives, and earn points for community service.
            </p>
            <div className="mt-5">
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-md border border-slate-200 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <span>Sign in with Google to Begin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impact stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-primary-blue flex items-center justify-center shrink-0">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Filed</span>
            <span className="text-lg font-black text-slate-800 leading-none mt-0.5 block">{totalIssues} Reports</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 animate-pulse-slow" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Work In Progress</span>
            <span className="text-lg font-black text-slate-800 leading-none mt-0.5 block">{inProgressIssues} Active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolved Issues</span>
            <span className="text-lg font-black text-slate-800 leading-none mt-0.5 block">{resolvedIssues} Closed</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-200/60 p-4 rounded-2xl shadow-xs flex items-center gap-3 cursor-pointer hover:bg-amber-500/5 transition-colors" onClick={onNavigateToDrives}>
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 glow-orange">
            <Flame className="h-5 w-5 fill-accent-orange text-accent-orange animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Eco Drives RSVP</span>
            <span className="text-xs font-extrabold text-slate-700 leading-none mt-1 flex items-center gap-0.5">
              Volunteer Now <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Content: Sidebar and Main Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Category Filter Chips & Top Citizens (1 Col) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Categories Sidebar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Filter Categories</span>
            <div className="flex flex-row lg:flex-col flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCatFilter(cat.id)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    catFilter === cat.id
                      ? 'bg-blue-50/80 text-primary-blue font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mini Top Citizens Sidebar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Top Heroes</span>
              <Trophy className="h-4 w-4 text-accent-orange shrink-0" />
            </div>
            
            <div className="space-y-3">
              {displayLeaderboard.slice(0, 3).map((hero, idx) => {
                const isCurrentUser = user && hero.uid === user.uid;
                return (
                  <div key={hero.uid} className={`flex items-center gap-2 text-xs p-1.5 rounded-xl border ${
                    isCurrentUser ? 'bg-amber-50 border-amber-200 shadow-xs' : 'border-transparent'
                  }`}>
                    <span className="font-extrabold text-slate-400 w-4">#{idx+1}</span>
                    <div className="h-6 w-6 rounded bg-slate-100 text-primary-blue flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200/50">
                      {(hero.name || hero.displayName).charAt(0)}
                    </div>
                    <span className={`font-bold truncate flex-1 ${isCurrentUser ? 'text-amber-900' : 'text-slate-700'}`}>
                      {hero.name || hero.displayName}
                    </span>
                    <span className="font-black text-amber-700 bg-amber-50 border border-amber-200/30 px-1.5 py-0.5 rounded text-[10px]">
                      {hero.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Main Feed Display (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Feed Control Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Left Tools: Status Filters */}
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-slate-400 text-xs font-bold mr-1 flex items-center gap-1 shrink-0"><Filter className="h-3.5 w-3.5" /> Status:</span>
              {['all', 'reported', 'in_progress', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1).replace('_', ' ')}
                </button>
              ))}

              <div className="h-5 w-[1px] bg-slate-200 mx-1.5 hidden sm:block" />

              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showMap
                    ? 'bg-primary-blue border-primary-blue text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Map className="h-3.5 w-3.5" />
                <span>Map View</span>
              </button>
            </div>

            {/* Right Tools: View Switchers and Sort dropdown */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Sort by dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'upvotes')}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition-colors"
              >
                <option value="upvotes">Sort: Highest Urgent</option>
                <option value="date">Sort: Most Recent</option>
              </select>

              {/* View Grid/Map toggles */}
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-primary-blue shadow-xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="View list feed"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'map' ? 'bg-white text-primary-blue shadow-xs' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="View map hotspots"
                >
                  <Map className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Report Trigger */}
              <button
                onClick={onNavigateToReport}
                className="flex items-center gap-1 px-3 py-1.5 bg-accent-orange hover:bg-accent-orange-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Report Issue</span>
              </button>
            </div>
          </div>

          {/* Feed Content */}
          <div className="w-full space-y-6">
            {showMap && (
              <CivicMap onSelectIssue={onSelectIssue} issues={filteredIssues} />
            )}
            <div className="w-full">
            {viewMode === 'map' ? (
              <InteractiveMap issues={filteredIssues} onSelectIssue={onSelectIssue} />
            ) : issues.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold shadow-xs flex flex-col items-center justify-center space-y-3">
                <div className="p-4 rounded-full bg-blue-50 text-primary-blue">
                  <AlertTriangle className="h-10 w-10 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">No issues reported yet</h3>
                  <p className="text-slate-400 text-xs mt-1">Be the first Hero to report an infrastructure complaint!</p>
                </div>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-semibold shadow-xs">
                No reports matched the specified filters. Try selecting another category or status.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onSelect={onSelectIssue}
                    onUpvote={upvoteIssue}
                  />
                ))}
              </div>
            )}
          </div>
          </div>

        </div>

      </div>
    </div>
  );
};
