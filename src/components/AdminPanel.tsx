import React, { useState } from 'react';
import type { Issue } from '../types';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Eye, Play, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface AdminPanelProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

const PRESET_RESOLUTION_IMAGES = [
  { label: 'Paved Asphalt Patch', url: 'https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Clean Swept Pathway', url: 'https://images.unsplash.com/photo-1616963248328-98e33a2e76ca?auto=format&fit=crop&w=800&q=80' },
  { label: 'Restored Water Valve', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80' },
  { label: 'New LED Streetlight Pole', url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80' },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ issues, onSelectIssue }) => {
  const { user } = useAuth();
  const { updateIssueStatus } = useApp();
  const [selectedIssueForResolve, setSelectedIssueForResolve] = useState<Issue | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  if (user?.role !== 'authority') {
    return (
      <div className="mx-auto max-w-md text-center py-12 px-4">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
        <h2 className="font-bold text-slate-800 text-lg">Access Restricted</h2>
        <p className="text-slate-500 text-sm mt-2">
          This workspace is only accessible to Ward Officers. Please use the "View Role" switcher in the header to change your role.
        </p>
      </div>
    );
  }

  // Filter out resolved issues for the dashboard list
  const activeIssues = issues.filter(i => i.status !== 'resolved');
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;

  const handleOpenResolveModal = (issue: Issue) => {
    setSelectedIssueForResolve(issue);
    setNotes('');
    setSelectedImageIdx(0);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueForResolve) return;

    await updateIssueStatus(
      selectedIssueForResolve.id,
      'resolved',
      notes || 'Resolved and cleaned by BBMP Ward Sanitation & Engineering Cell.',
      PRESET_RESOLUTION_IMAGES[selectedImageIdx].url
    );

    setSelectedIssueForResolve(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      
      {/* Admin stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Ward Jurisdiction</span>
          <span className="text-xl font-extrabold text-slate-800 mt-1 block">Ward 150 (Bellandur)</span>
        </div>
        <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest block">Active Work Orders</span>
          <span className="text-xl font-extrabold text-rose-700 mt-1 block">{activeIssues.length} Complaints</span>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest block">Completed Resolutions</span>
          <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{resolvedCount} Issues</span>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="border-b border-slate-100 bg-slate-50/70 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold text-slate-800 text-base">Authority Operations Console</h2>
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase">
            Sorted by support urgency (Upvotes)
          </span>
        </div>

        {activeIssues.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold">
            🎉 Bravo! There are no outstanding citizen complaints in your Ward.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeIssues.map((issue) => {
              const urgency = (issue.upvotes || 0) >= 3 ? 'high' : 'normal';
              return (
                <div key={issue.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  
                  {/* Left Info Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-slate-200 text-slate-600 bg-slate-100`}>
                        {issue.category}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        urgency === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {urgency === 'high' ? '🔥 High Priority' : 'Normal'}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {issue.upvotes || 0} Citizen Supports
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base mt-2 truncate">{issue.title}</h3>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-1">{issue.location.address}</p>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectIssue(issue)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                      title="Inspect details & comments"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {issue.status === 'reported' && (
                      <button
                        onClick={() => updateIssueStatus(issue.id, 'assigned')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-all cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Approve Work</span>
                      </button>
                    )}

                    {(issue.status === 'assigned' || issue.status === 'reported') && (
                      <button
                        onClick={() => updateIssueStatus(issue.id, 'in_progress')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 transition-all cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Deploy Crew</span>
                      </button>
                    )}

                    {issue.status === 'in_progress' && (
                      <button
                        onClick={() => handleOpenResolveModal(issue)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Complete Resolution</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolution Submission Dialog Modal */}
      {selectedIssueForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl shadow-2xl p-6 overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Resolve: {selectedIssueForResolve.title.substr(0, 30)}...
              </h3>
              <button
                onClick={() => setSelectedIssueForResolve(null)}
                className="text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 hover:bg-slate-100 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              {/* Note input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resolution Work Details</label>
                <textarea
                  required
                  placeholder="Detail the work carried out (e.g.BWSSB team excavated & patched pipe, asphalt filled potholes, garbage cleared by ward staff)..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-50/70 focus:bg-white text-xs font-semibold p-3 rounded-xl border border-slate-200 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue outline-none transition-all"
                />
              </div>

              {/* Presets images select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select After-Completion Proof Image</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_RESOLUTION_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`flex flex-col text-left rounded-xl overflow-hidden border p-1 bg-slate-50 hover:bg-white transition-all cursor-pointer ${
                        selectedImageIdx === idx ? 'border-primary-blue ring-1 ring-primary-blue bg-white' : 'border-slate-200'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="aspect-video w-full object-cover rounded-lg" />
                      <span className="p-1.5 text-[9px] font-bold text-slate-700 truncate block w-full">{img.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssueForResolve(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Submit & Resolve Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
