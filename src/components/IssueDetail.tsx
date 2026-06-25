import React, { useState } from 'react';
import type { Issue } from '../types';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, User, ThumbsUp, Send, ArrowLeft, MessageCircle, Shield, CheckCircle, Info, Clock, AlertTriangle, Camera } from 'lucide-react';
import { CivicImage } from './CivicImage';

interface IssueDetailProps {
  issue: Issue;
  onBack: () => void;
  onUpvote: (id: string) => void;
  onAddComment: (issueId: string, text: string) => void;
  onUpdateStatus: (issueId: string, status: 'assigned' | 'in_progress' | 'resolved', notes?: string, resolvedImageUrl?: string) => Promise<void>;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({ issue, onBack, onUpvote, onAddComment, onUpdateStatus }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  
  // Officer resolution states
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [resolveFile, setResolveFile] = useState<File | null>(null);
  const [resolveFilePreview, setResolveFilePreview] = useState<string | null>(null);
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);

  const hasUpvoted = user && issue.upvotedBy ? issue.upvotedBy.includes(user.uid) : false;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(issue.id, commentText);
    setCommentText('');
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || !resolveFile) return;

    setIsSubmittingResolution(true);
    let uploadedUrl = '';

    try {
      if (resolveFile) {
        uploadedUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(resolveFile);
        });
      }

      await onUpdateStatus(issue.id, 'resolved', notes, uploadedUrl);
      setShowResolveForm(false);
      setResolveFile(null);
      setResolveFilePreview(null);
    } catch (err) {
      console.error("Resolution update failed:", err);
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'reported': return 'Report Filed';
      case 'assigned': return 'Assigned to Inspector';
      case 'in_progress': return 'Work In Progress';
      case 'resolved': return 'Civic Resolution Completed';
      default: return 'Report Filed';
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-slate-600 bg-white hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-xs mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Civic Feed</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Images & Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            
            {/* Header Title */}
            <div className="p-6 border-b border-slate-100">
              <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md border ${
                issue.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {issue.status}
              </span>
              <h1 className="mt-3 font-bold text-slate-800 text-xl sm:text-2xl leading-snug">{issue.title}</h1>
              
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4 text-slate-400" />
                  Reported by {issue.reportedByName || 'Citizen'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formatDate(issue.createdAt || issue.reportedAt || '')}
                </span>
              </div>
            </div>

            {/* Evidence Image Block */}
            <div className="p-6 space-y-4">
              {issue.status === 'resolved' ? (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Before & After Resolution</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <CivicImage 
                          src={issue.imageURL || issue.imageUrl} 
                          alt="Before complaint" 
                          category={issue.category} 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block text-center">Before (Complaint photo)</span>
                    </div>
                    <div className="space-y-1">
                      <div className="aspect-video rounded-xl overflow-hidden border border-emerald-250 bg-slate-100">
                        <CivicImage 
                          src={issue.resolvedImageUrl} 
                          alt="After resolution" 
                          category="drive" 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block text-center">After (Resolution photo)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Complaint Image Evidence</span>
                  <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <CivicImage 
                      src={issue.imageURL || issue.imageUrl} 
                      alt="Complaint evidence" 
                      category={issue.category} 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mt-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Complaint Details</span>
                <p className="mt-1 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{issue.description}</p>
              </div>

              {/* Location Area */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Complaint Location</span>
                <div className="mt-1.5 flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-accent-orange shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{issue.location.address}</span>
                    <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                      Lat: {issue.location.lat.toFixed(4)}, Lng: {issue.location.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Panel Upvote Action */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Are you also affected by this? Upvote to boost urgency.
              </span>
              <button
                onClick={() => onUpvote(issue.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer active:scale-95 ${
                  hasUpvoted
                    ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? 'fill-white' : ''}`} />
                <span>{issue.upvotes || 0} {hasUpvoted ? 'Supported' : 'Support Issue'}</span>
              </button>
            </div>

          </div>

          {/* Officer Operations Panel */}
          {user?.role === 'authority' && issue.status !== 'resolved' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Officer Actions Console</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {issue.status === 'reported' && (
                  <button
                    onClick={() => onUpdateStatus(issue.id, 'in_progress')}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Mark In Progress
                  </button>
                )}
                
                <button
                  onClick={() => setShowResolveForm(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Mark Resolved
                </button>
              </div>
              
              {showResolveForm && (
                <form onSubmit={handleResolveSubmit} className="space-y-4 border-t border-slate-250 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Resolution Notes</label>
                    <textarea
                      required
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe the resolved state (e.g. BBMP sweep squad cleaned the commercial dump, asphalt paved the crater)..."
                      className="w-full bg-slate-50 text-xs font-semibold p-3 rounded-xl border border-slate-200 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue focus:bg-white outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Upload After-Resolution Proof Photo</label>
                    <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-350 bg-slate-50 hover:bg-slate-100 hover:border-emerald-500 transition-all cursor-pointer relative min-h-[100px]">
                      {resolveFilePreview ? (
                        <div className="relative w-full h-24">
                          <img src={resolveFilePreview} alt="Resolution Preview" className="h-full w-full object-cover rounded-lg" />
                        </div>
                      ) : (
                        <div className="text-center text-slate-400">
                          <Camera className="mx-auto h-5 w-5 mb-1" />
                          <span className="text-[10px] font-bold block">Upload Completion Photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        required
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setResolveFile(file);
                            setResolveFilePreview(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResolveForm(false);
                        setResolveFile(null);
                        setResolveFilePreview(null);
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingResolution}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isSubmittingResolution ? 'Uploading & Resolving...' : 'Submit Resolution'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Comments Discussion Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageCircle className="h-5 w-5 text-slate-500" />
              Community Discussion ({(issue.comments || []).length})
            </h3>

            {/* Comments List */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {(!issue.comments || issue.comments.length === 0) ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  No comments yet. Start the conversation below!
                </div>
              ) : (
                issue.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/30">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                      comment.role === 'authority' ? 'bg-emerald-600' : 'bg-primary-blue'
                    }`}>
                      {(comment.userName || 'C').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate">{comment.userName}</span>
                        {comment.role === 'authority' && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold uppercase tracking-wider shrink-0">
                            <Shield className="h-2 w-2" />
                            Officer
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 ml-auto shrink-0">{formatDate(comment.timestamp)}</span>
                      </div>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed break-words">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleSubmitComment} className="flex gap-2 border-t border-slate-100 pt-4">
                <input
                  type="text"
                  placeholder="Ask for status update or leave a helpful comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-slate-100 hover:bg-slate-100/70 focus:bg-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue outline-none transition-all"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="text-center text-xs text-slate-400 font-semibold pt-2">
                Please sign in to join the discussion.
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Status Timeline Tracker (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2.5">
              Work Order Tracker
            </h3>

            {/* Timeline component */}
            <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6 py-2">
              
              {/* Step 4: Resolved */}
              <div className="relative">
                <span className={`absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full border ${
                  issue.status === 'resolved' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'
                }`}>
                  <CheckCircle className="h-3.5 w-3.5" />
                </span>
                <div className="min-h-[40px]">
                  <h4 className={`text-xs font-bold ${issue.status === 'resolved' ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {getStatusLabel('resolved')}
                  </h4>
                  {issue.status === 'resolved' && (
                    <div className="mt-1 text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">Officer:</span> {issue.resolvedBy}
                      <p className="mt-1 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 text-emerald-900 leading-snug">
                        "{issue.resolutionNotes}"
                      </p>
                      <span className="block mt-1 text-[9px] text-slate-400">{formatDate(issue.resolvedAt || '')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: In Progress */}
              <div className="relative">
                <span className={`absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full border ${
                  issue.status === 'in_progress' || issue.status === 'resolved' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200'
                }`}>
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <div className="min-h-[40px]">
                  <h4 className={`text-xs font-bold ${
                    issue.status === 'in_progress' ? 'text-amber-700' : issue.status === 'resolved' ? 'text-slate-700' : 'text-slate-500'
                  }`}>
                    {getStatusLabel('in_progress')}
                  </h4>
                  {(issue.status === 'in_progress' || issue.status === 'resolved') && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Ward engineers deployed to locality for repair works.
                    </p>
                  )}
                </div>
              </div>

              {/* Step 2: Assigned */}
              <div className="relative">
                <span className={`absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full border ${
                  issue.status !== 'reported' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-200'
                }`}>
                  <Info className="h-3.5 w-3.5" />
                </span>
                <div className="min-h-[40px]">
                  <h4 className={`text-xs font-bold ${issue.status !== 'reported' ? 'text-indigo-700' : 'text-slate-500'}`}>
                    {getStatusLabel('assigned')}
                  </h4>
                  {issue.status !== 'reported' && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Work order approved and assigned to Ward Engineering Cell.
                    </p>
                  )}
                </div>
              </div>

              {/* Step 1: Reported */}
              <div className="relative">
                <span className="absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 border-blue-500 text-white">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <div className="min-h-[40px]">
                  <h4 className="text-xs font-bold text-slate-700">
                    {getStatusLabel('reported')}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Citizen reported complaint with photo proof.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
