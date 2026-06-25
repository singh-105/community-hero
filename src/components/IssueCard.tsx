import React from 'react';
import type { Issue } from '../types';
import { useAuth } from '../context/AuthContext';
import { MapPin, ThumbsUp, Calendar, ChevronRight, AlertTriangle, Trash2, CheckCircle2, Hammer, Eye } from 'lucide-react';
import { CivicImage } from './CivicImage';

interface IssueCardProps {
  issue: Issue;
  onSelect: (issue: Issue) => void;
  onUpvote: (id: string) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onSelect, onUpvote }) => {
  const { user } = useAuth();
  const hasUpvoted = user && issue.upvotedBy ? issue.upvotedBy.includes(user.uid) : false;

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'pothole':
        return { label: 'Pothole', color: 'bg-rose-50 text-rose-700 border-rose-200/50', icon: <AlertTriangle className="h-4 w-4" /> };
      case 'garbage':
        return { label: 'Garbage pile', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', icon: <Trash2 className="h-4 w-4" /> };
      case 'water_leak':
        return { label: 'Water leakage', color: 'bg-blue-50 text-blue-700 border-blue-200/50', icon: <CheckCircle2 className="h-4 w-4" /> };
      case 'streetlight':
        return { label: 'Streetlight out', color: 'bg-yellow-50 text-yellow-700 border-yellow-250/50', icon: <Hammer className="h-4 w-4" /> };
      default:
        return { label: 'Civic issue', color: 'bg-slate-50 text-slate-700 border-slate-200/50', icon: <AlertTriangle className="h-4 w-4" /> };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'reported':
        return { text: 'Reported', badge: 'bg-red-50 text-red-700 border-red-200', progress: 'w-1/4 bg-red-500' };
      case 'assigned':
        return { text: 'Assigned', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', progress: 'w-2/4 bg-indigo-500' };
      case 'in_progress':
        return { text: 'In Progress', badge: 'bg-amber-50 text-amber-700 border-amber-200', progress: 'w-3/4 bg-amber-500' };
      case 'resolved':
        return { text: 'Resolved', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', progress: 'w-full bg-emerald-500' };
      default:
        return { text: 'Reported', badge: 'bg-slate-50 text-slate-700 border-slate-200', progress: 'w-1/4 bg-slate-500' };
    }
  };

  const catDetails = getCategoryDetails(issue.category);
  const statusStyle = getStatusStyle(issue.status);

  // Format date
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all duration-300 hover:-translate-y-1">
      {/* Image container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <CivicImage
          src={issue.imageURL || issue.imageUrl}
          alt={issue.title}
          category={issue.category}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Floating Category Badge */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border backdrop-blur-md ${catDetails.color}`}>
            {catDetails.icon}
            {catDetails.label}
          </span>
        </div>

        {/* Floating Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border shadow-xs ${statusStyle.badge}`}>
            {statusStyle.text}
          </span>
        </div>

        {/* Shading overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-60 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(issue.createdAt || issue.reportedAt || '')}
          </span>
          <span>•</span>
          <span className="truncate max-w-[120px]">By {issue.reportedByName || 'Citizen'}</span>
        </div>

        <h3 className="font-bold text-slate-800 text-lg leading-snug line-clamp-1 group-hover:text-primary-blue transition-colors">
          {issue.title}
        </h3>

        <p className="mt-2 text-slate-500 text-xs leading-relaxed line-clamp-2 flex-1">
          {issue.description}
        </p>

        {/* Location Display */}
        <div className="mt-4 flex items-start gap-1.5 text-slate-600">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <span className="text-xs font-semibold line-clamp-1">{issue.location.address}</span>
        </div>

        {/* Progress Bar indicator */}
        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-500 ${statusStyle.progress}`} />
        </div>

        {/* Bottom actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Support / Upvote Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpvote(issue.id);
            }}
            disabled={!user}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer active:scale-95 disabled:opacity-50 ${
              hasUpvoted
                ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title={user ? 'Support this issue to raise urgency' : 'Please sign in to support'}
          >
            <ThumbsUp className={`h-3.5 w-3.5 ${hasUpvoted ? 'fill-white stroke-[2.5]' : ''}`} />
            <span>{issue.upvotes || 0} {hasUpvoted ? 'Supported' : 'Support'}</span>
          </button>

          {/* Comment Count / Details Action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSelect(issue);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary-blue hover:text-primary-blue-hover hover:bg-blue-50/50 rounded-lg transition-all cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View Work</span>
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
