import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, LogOut, ShieldAlert, Menu, X } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, signInWithGoogle, notification } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = user?.role === 'authority'
    ? [
        { id: 'admin', label: 'Authority Desk' },
        { id: 'dashboard', label: 'Pending Issues' },
        { id: 'drives', label: 'Clean-up Drives' },
        { id: 'leaderboard', label: 'Heroes Leaderboard' },
      ]
    : [
        { id: 'dashboard', label: 'Civic Feed' },
        { id: 'report', label: 'Report Issue' },
        { id: 'drives', label: 'Clean-up Drives' },
        { id: 'leaderboard', label: 'Heroes Leaderboard' },
      ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleTabClick('dashboard')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-blue text-white shadow-md shadow-blue-500/20 transition-transform duration-300 hover:scale-105">
              <ShieldAlert className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-primary-blue">
                Community<span className="text-accent-orange">Hero</span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none">
                Civic Action Portal
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'text-primary-blue bg-blue-50/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-primary-blue" />
                )}
              </button>
            ))}
          </nav>

          {/* Right Action Icons */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Point Indicator */}
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-lg">
                <Award className="h-4 w-4 text-accent-orange animate-bounce" />
                <span className="text-sm font-bold text-amber-800">{user.points} pts</span>
              </div>

              {/* Profile/Role Header */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-tight">{user.displayName}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${user.role === 'authority' ? 'text-emerald-600' : 'text-primary-blue'}`}>
                  {user.role === 'authority' ? 'Ward Officer' : 'Citizen Hero'}
                </span>
              </div>

              {/* Log Out */}
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 md:hidden text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-4 py-2 text-sm font-bold text-white bg-primary-blue hover:bg-primary-blue-hover rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`block w-full text-left px-4 py-2.5 text-sm font-bold rounded-lg ${
                activeTab === tab.id
                  ? 'text-primary-blue bg-blue-50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {user && (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-bold text-slate-500">Logged in as:</span>
                <span className="text-xs font-bold text-slate-800">{user.displayName}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-white shadow-xl animate-fade-in-up ${
          notification.type === 'error' ? 'bg-rose-950 border border-rose-800' : 'bg-slate-900'
        }`}>
          <div className={`h-2.5 w-2.5 rounded-full ${
            notification.type === 'success' 
              ? 'bg-emerald-500' 
              : notification.type === 'error'
              ? 'bg-rose-500'
              : 'bg-blue-400'
          }`} />
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}
    </header>
  );
};
