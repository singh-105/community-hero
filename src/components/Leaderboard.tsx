import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Award, Flame } from 'lucide-react';


export const Leaderboard: React.FC = () => {
  const { leaderboard } = useApp();
  const { user } = useAuth();

  const displayLeaderboard = leaderboard.length > 0 
    ? leaderboard 
    : (user ? [user] : []);

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 border border-amber-300 font-black text-sm shadow-xs glow-orange">🥇</div>;
      case 2:
        return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-300 font-black text-sm shadow-xs">🥈</div>;
      case 3:
        return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 border border-orange-200 font-black text-sm shadow-xs">🥉</div>;
      default:
        return <span className="text-slate-400 font-bold text-xs w-8 text-center">#{rank}</span>;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      
      {/* Header and intro */}
      <div className="mb-8">
        <h1 className="font-extrabold text-slate-800 text-2xl sm:text-3xl flex items-center gap-2">
          <Award className="h-7 w-7 text-accent-orange animate-bounce" />
          Community Heroes Leaderboard
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Celebrating local residents taking active action to improve the ward. Join clean-ups, file verified reports, and earn your badge!
        </p>
      </div>

      {/* Top 3 Podiums or Empty State */}
      {displayLeaderboard.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 font-bold shadow-xs">
          No civic contributors on the leaderboard yet. Be the first to earn points!
        </div>
      ) : (
        <>
          {/* Top 3 Podiums (Visual highlight for top 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 pt-4">
            {displayLeaderboard.slice(0, 3).map((hero, idx) => {
              const rank = idx + 1;
              const isCurrentUser = user && hero.uid === user.uid;
              const bgColors = [
                'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-250 shadow-sm',
                'bg-gradient-to-b from-slate-500/10 to-transparent border-slate-200',
                'bg-gradient-to-b from-orange-500/10 to-transparent border-orange-200',
              ];
              
              return (
                <div 
                  key={hero.uid} 
                  className={`relative overflow-hidden rounded-2xl border p-5 text-center flex flex-col items-center bg-white ${
                    isCurrentUser ? 'ring-2 ring-amber-500 border-amber-300 shadow-md scale-105' : bgColors[idx]
                  }`}
                >
                  {/* Floating Rank badge */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2">
                    {getRankMedal(rank)}
                  </div>

                  {/* Avatar circle */}
                  <div className="mt-8 h-16 w-16 rounded-2xl bg-primary-blue text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white">
                    {(hero.name || hero.displayName || 'C').charAt(0)}
                  </div>

                  <h3 className="mt-3 font-extrabold text-slate-800 text-sm">
                    {hero.name || hero.displayName}
                  </h3>
                  
                  <div className="mt-1 flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/40">
                    <Flame className="h-3.5 w-3.5 fill-accent-orange text-accent-orange" />
                    <span className="text-xs font-black">{hero.points} pts</span>
                  </div>

                  {/* Badges row */}
                  <div className="mt-4 flex flex-wrap justify-center gap-1 max-h-12 overflow-hidden">
                    {(hero.badges || []).slice(0, 2).map((badge, bIdx) => (
                      <span 
                        key={bIdx} 
                        className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-slate-100 border border-slate-200/50 text-slate-600 uppercase tracking-wide"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  {/* Impact breakdown stats */}
                  <div className="mt-5 grid grid-cols-3 gap-2 w-full text-center border-t border-slate-100 pt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Filed</span>
                      <span className="text-xs font-extrabold text-slate-700">{hero.reportedIssuesCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">RSVPs</span>
                      <span className="text-xs font-extrabold text-slate-700">{hero.rsvpCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Solved</span>
                      <span className="text-xs font-extrabold text-slate-700">{hero.resolvedIssuesCount || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard Table List */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">Citizen Rankings</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Live Community Standing</span>
            </div>

            <div className="divide-y divide-slate-100 bg-white">
              {displayLeaderboard.map((hero, idx) => {
                const rank = idx + 1;
                const isCurrentUser = user && hero.uid === user.uid;
                return (
                  <div 
                    key={hero.uid} 
                    className={`flex items-center justify-between p-4 px-6 transition-all duration-200 ${
                      isCurrentUser ? 'bg-amber-50/70 border-y border-amber-100 shadow-xs' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Left Info: Rank and user profile */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-8 flex justify-center shrink-0">
                        {getRankMedal(rank)}
                      </div>
                      
                      {/* User Profile avatar */}
                      <div className="h-9 w-9 rounded-xl bg-slate-100 text-primary-blue flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200/50">
                        {(hero.name || hero.displayName || 'C').charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <span className={`font-bold text-sm truncate block ${isCurrentUser ? 'text-amber-900 font-black' : 'text-slate-800'}`}>
                          {hero.name || hero.displayName}
                        </span>
                        {/* Badge badges */}
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(hero.badges || []).map((badge, bIdx) => (
                            <span 
                              key={bIdx} 
                              className="px-1.5 py-0.2 text-[8px] font-bold rounded bg-slate-50 border border-slate-200/40 text-slate-500 uppercase shrink-0"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Info: Points tally */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-black text-amber-700 bg-amber-50/60 border border-amber-200/30 px-3 py-1 rounded-xl flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 fill-accent-orange text-accent-orange" />
                          {hero.points} pts
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
