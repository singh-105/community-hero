import React, { useState } from 'react';
import type { Issue } from '../types';
import { MapPin, ArrowRight, MessageSquare, ThumbsUp } from 'lucide-react';

interface InteractiveMapProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ issues, onSelectIssue }) => {
  const [selectedPin, setSelectedPin] = useState<Issue | null>(null);

  // Map coordinates to SVG viewbox (500x300)
  // Bangalore latitude range: ~12.90 to 12.99, longitude range: ~77.58 to 77.67
  const minLat = 12.9000;
  const maxLat = 12.9900;
  const minLng = 77.5800;
  const maxLng = 77.6700;

  const getCoordinates = (lat: number, lng: number) => {
    // Project lat/lng linearly onto SVG 600x350 box
    const x = ((lng - minLng) / (maxLng - minLng)) * 500 + 50;
    const y = 350 - (((lat - minLat) / (maxLat - minLat)) * 250 + 50);
    return { x, y };
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pothole': return 'fill-rose-500 stroke-rose-200';
      case 'garbage': return 'fill-amber-500 stroke-amber-200';
      case 'water_leak': return 'fill-blue-500 stroke-blue-200';
      case 'streetlight': return 'fill-yellow-500 stroke-yellow-200';
      default: return 'fill-indigo-500 stroke-indigo-200';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'assigned': return 'bg-blue-50 text-primary-blue border-blue-200';
      case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="relative w-full rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs">
      {/* Map Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-blue" />
          <span className="font-bold text-slate-800 text-sm">Ward Civic Map (Live Hotspots)</span>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-500 uppercase">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Potholes</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Garbage</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Leaks</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Lights</span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative aspect-[16/9] w-full bg-slate-100/90 overflow-hidden cursor-grab active:cursor-grabbing">
        <svg viewBox="0 0 600 350" className="w-full h-full select-none">
          {/* Background grid lines */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Styled Lakes / Water Bodies */}
          <path d="M 80 180 Q 120 140 180 190 T 260 210 Q 200 280 120 260 Z" className="fill-blue-100/70 stroke-blue-200 stroke-[1.5]" />
          <path d="M 440 80 Q 480 60 520 100 T 560 140 Q 500 180 430 130 Z" className="fill-blue-100/70 stroke-blue-200 stroke-[1.5]" />

          {/* Styled Parks / Forests */}
          <rect x="340" y="180" width="120" height="80" rx="15" className="fill-emerald-50/80 stroke-emerald-100 stroke-[1.5]" />
          <text x="400" y="225" textAnchor="middle" className="fill-emerald-800/40 font-bold text-[10px] tracking-wider uppercase font-sans">Public Garden</text>
          
          <rect x="80" y="40" width="150" height="60" rx="10" className="fill-emerald-50/80 stroke-emerald-100 stroke-[1.5]" />
          <text x="155" y="75" textAnchor="middle" className="fill-emerald-800/40 font-bold text-[10px] tracking-wider uppercase font-sans">Reserve Park</text>

          {/* Major Grid/Road Lines */}
          {/* Outer Ring Road */}
          <path d="M -20 150 Q 150 140 300 160 T 620 180" fill="none" className="stroke-slate-300 stroke-[12] stroke-linecap-round opacity-80" />
          <path d="M -20 150 Q 150 140 300 160 T 620 180" fill="none" className="stroke-white stroke-[4] stroke-linecap-round stroke-dasharray-[6,6]" />
          
          {/* Secondary Roads */}
          <path d="M 120 -20 L 120 370" fill="none" className="stroke-slate-200/80 stroke-[8]" />
          <path d="M 280 -20 Q 300 150 280 370" fill="none" className="stroke-slate-200/80 stroke-[8]" />
          <path d="M 480 -20 L 480 370" fill="none" className="stroke-slate-200/80 stroke-[8]" />
          <path d="M -20 280 L 620 280" fill="none" className="stroke-slate-200/80 stroke-[8]" />
          <path d="M -20 70 L 620 70" fill="none" className="stroke-slate-200/80 stroke-[8]" />

          {/* Text Labels for neighborhoods */}
          <text x="130" y="130" className="fill-slate-400/70 font-extrabold text-[9px] uppercase tracking-widest font-sans">Indiranagar</text>
          <text x="490" y="270" className="fill-slate-400/70 font-extrabold text-[9px] uppercase tracking-widest font-sans">HSR Layout</text>
          <text x="290" y="320" className="fill-slate-400/70 font-extrabold text-[9px] uppercase tracking-widest font-sans">Koramangala</text>

          {/* Render Pins */}
          {issues.map((issue) => {
            const { x, y } = getCoordinates(issue.location.lat, issue.location.lng);
            const isSelected = selectedPin?.id === issue.id;

            return (
              <g 
                key={issue.id} 
                className="cursor-pointer group"
                onClick={() => setSelectedPin(issue)}
              >
                {/* Ping animation wrapper */}
                {issue.status !== 'resolved' && (
                  <circle 
                    cx={x} 
                    cy={y} 
                    r={isSelected ? 16 : 9} 
                    className={`${getCategoryColor(issue.category)} opacity-40 animate-ping`}
                  />
                )}
                {/* Main pin circle */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isSelected ? 8 : 6} 
                  className={`${getCategoryColor(issue.category)} stroke-[2] transition-all duration-300 group-hover:scale-125`}
                />
                {/* Secondary inner core */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="2" 
                  className="fill-white" 
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Details Overlay Card */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 glass-panel p-4 rounded-xl shadow-lg border border-slate-200/80 animate-fade-in z-10">
            <div className="flex items-start justify-between">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${getStatusBg(selectedPin.status)}`}>
                {selectedPin.status}
              </span>
              <button 
                onClick={() => setSelectedPin(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 hover:bg-slate-100 rounded-sm"
              >
                ✕
              </button>
            </div>
            
            <h4 className="mt-2 font-bold text-slate-800 text-sm line-clamp-1">{selectedPin.title}</h4>
            <p className="mt-1 text-slate-500 text-xs line-clamp-2">{selectedPin.description}</p>
            
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100 pt-2.5">
              <span className="flex items-center gap-1 font-semibold">
                <ThumbsUp className="h-3 w-3 text-primary-blue" />
                {selectedPin.upvotes || 0} supports
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <MessageSquare className="h-3 w-3 text-slate-500" />
                {selectedPin.comments.length} comments
              </span>
            </div>

            <button
              onClick={() => onSelectIssue(selectedPin)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-bold py-2 rounded-lg transition-all duration-300 shadow-sm"
            >
              <span>View Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
