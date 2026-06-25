import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';

import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ReportWizard } from './components/ReportWizard';
import { DrivesSection } from './components/DrivesSection';
import { Leaderboard } from './components/Leaderboard';
import { AdminPanel } from './components/AdminPanel';
import { IssueDetail } from './components/IssueDetail';
import type { Issue } from './types';
import { ShieldCheck, Heart, ExternalLink, User } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, selectInitialRole, loading: authLoading } = useAuth();
  const { issues, upvoteIssue, addComment, updateIssueStatus, loading: appLoading } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Handle redirects on role toggle
  React.useEffect(() => {
    if (!user?.role) return;
    if (user.role === 'authority') {
      if (activeTab === 'report') {
        setActiveTab('admin');
      }
    } else {
      if (activeTab === 'admin') {
        setActiveTab('dashboard');
      }
    }
  }, [user?.role, activeTab]);

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const handleClearSelectedIssue = () => {
    setSelectedIssue(null);
  };

  if (authLoading || appLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="h-10 w-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Live Civic Portal...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* First-time Google Login Role Selection Overlay */}
      {user && !user.role && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white border border-slate-200/85 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden p-8 space-y-6 animate-scale-up text-center">
            
            {/* Header Badge */}
            <div className="flex justify-center">
              <span className="text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white px-3 py-1 rounded-full shadow-xs">
                Welcome to Community Hero
              </span>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="font-black text-slate-800 text-2xl sm:text-3xl tracking-tight">
                Choose Your Civic Role
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                To personalize your dashboard and help you engage with your neighborhood, please select your primary role:
              </p>
            </div>

            {/* Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Option A: Citizen */}
              <button
                onClick={() => selectInitialRole('citizen')}
                className="group flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-400 rounded-2xl transition-all duration-300 cursor-pointer text-center space-y-3 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-100 text-primary-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-base block group-hover:text-primary-blue transition-colors">
                    Citizen Hero
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-1 leading-snug">
                    Report local issues, join clean-up drives, and earn badges for your community service.
                  </span>
                </div>
              </button>

              {/* Option B: Ward Officer */}
              <button
                onClick={() => selectInitialRole('authority')}
                className="group flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-400 rounded-2xl transition-all duration-300 cursor-pointer text-center space-y-3 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-base block group-hover:text-orange-500 transition-colors">
                    Ward Officer
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-1 leading-snug">
                    Review and approve work orders, deploy corporation crews, and sign off on completed resolutions.
                  </span>
                </div>
              </button>

            </div>

            {/* Footer Trust Info */}
            <div className="text-[10px] text-slate-400 font-semibold pt-4 flex items-center justify-center gap-1">
              <span>Secured by Indian Municipal Civic Trust Guidelines</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setSelectedIssue(null); // Clear detailed view on tab change
          setActiveTab(tab);
        }} 
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-6">
        {selectedIssue ? (
          <IssueDetail
            issue={selectedIssue}
            onBack={handleClearSelectedIssue}
            onUpvote={upvoteIssue}
            onUpdateStatus={async (id, status, notes, img) => {
              await updateIssueStatus(id, status, notes, img);
              setSelectedIssue(prev => prev ? { 
                ...prev, 
                status, 
                resolutionNotes: notes, 
                resolvedImageUrl: img,
                resolvedAt: status === 'resolved' ? new Date().toISOString() : undefined,
                resolvedBy: status === 'resolved' ? (user?.name || user?.displayName) : undefined
              } : null);
            }}
            onAddComment={async (issueId, text) => {
              await addComment(issueId, text);
              setSelectedIssue(prev => {
                if (prev && prev.id === issueId) {
                  const updatedComments = [
                    ...prev.comments,
                    {
                      id: 'temp_' + Date.now(),
                      userId: user?.uid || 'anonymous',
                      userName: user?.displayName || 'Anonymous Citizen',
                      role: user?.role || 'citizen',
                      text,
                      timestamp: new Date().toISOString()
                    }
                  ];
                  return { ...prev, comments: updatedComments };
                }
                return prev;
              });
            }}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                onSelectIssue={handleSelectIssue}
                onNavigateToReport={() => setActiveTab('report')}
                onNavigateToDrives={() => setActiveTab('drives')}
              />
            )}
            {activeTab === 'report' && (
              <ReportWizard 
                onGoToFeed={() => setActiveTab('dashboard')}
              />
            )}
            {activeTab === 'drives' && (
              <DrivesSection />
            )}
            {activeTab === 'leaderboard' && (
              <Leaderboard />
            )}
            {activeTab === 'admin' && (
              <AdminPanel
                issues={issues}
                onSelectIssue={handleSelectIssue}
              />
            )}
          </>
        )}
      </main>

      {/* Indian Civic Themed Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Col */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white font-extrabold text-xs">
                  CH
                </div>
                <span className="font-extrabold text-white text-base tracking-tight">
                  Community<span className="text-orange-500">Hero</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
                Empowering active residents of Bengaluru to collaborate with municipal corporations, resolve infrastructure issues, and foster cleaner, greener neighborhoods.
              </p>
            </div>
            
            {/* Middle Col */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Helpful Civic Links</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="https://bbmp.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1 transition-colors">
                    BBMP Official Portal <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a href="https://www.bwssb.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1 transition-colors">
                    BWSSB Water Board <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a href="https://bescom.co.in" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1 transition-colors">
                    BESCOM Power Grid <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Right Col */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-orange-500" />
                Indian Civic Trust
              </h4>
              <p className="text-xs leading-relaxed text-slate-400">
                This project runs in collaboration with volunteer neighborhood associations, ward committees, and local resident welfare associations (RWAs).
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Made in India</span>
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                <span>for the community</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-6 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} Community Hero. Designed with premium civic pride.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Security Rules</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Charter</a>
              <a href="#" className="hover:text-white transition-colors">Municipal Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
