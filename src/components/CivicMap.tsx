import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, MarkerClusterer, HeatmapLayer } from '@react-google-maps/api';
import { isFirebaseAvailable, db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Flame } from 'lucide-react';
import type { Issue } from '../types';

interface CivicMapProps {
  onSelectIssue: (issue: Issue) => void;
  issues?: Issue[];
}

export const CivicMap: React.FC<CivicMapProps> = ({ onSelectIssue, issues: propIssues }) => {
  const [issues, setIssues] = useState<Issue[]>(propIssues || []);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['visualization', 'places'] as any,
  });

  // Real-time Firestore Sync
  useEffect(() => {
    if (isFirebaseAvailable && db) {
      const unsubscribe = onSnapshot(collection(db, 'issues'), (snapshot) => {
        const issuesList: Issue[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          issuesList.push({
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            category: data.category || 'other',
            location: data.location || { lat: 12.9716, lng: 77.5946, address: '' },
            imageURL: data.imageURL || data.imageUrl || '',
            imageUrl: data.imageURL || data.imageUrl || '',
            resolvedImageUrl: data.resolvedImageUrl || '',
            status: data.status || 'reported',
            reportedBy: data.reportedBy || '',
            reportedByName: data.reportedByName || 'Citizen Hero',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
            upvotes: data.upvotes || 0,
            upvotedBy: data.upvotedBy || [],
            resolvedAt: data.resolvedAt || '',
            resolvedBy: data.resolvedBy || '',
            resolutionNotes: data.resolutionNotes || '',
            comments: data.comments || [],
          });
        });
        setIssues(issuesList);
      });
      return () => unsubscribe();
    } else {
      if (propIssues) {
        setIssues(propIssues);
      } else {
        const local = localStorage.getItem('community_hero_issues');
        if (local) {
          try {
            setIssues(JSON.parse(local));
          } catch (e) {
            console.error('Failed to parse local issues', e);
          }
        }
      }
    }
  }, [propIssues]);

  if (!isLoaded) {
    return (
      <div className="h-[300px] md:h-[500px] w-full flex items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Map View...</span>
        </div>
      </div>
    );
  }

  const getCategoryMarkerIcon = (category: string) => {
    const colors = {
      pothole: '#ef4444',      // Red
      water_leak: '#3b82f6',   // Blue
      garbage: '#10b981',      // Green
      streetlight: '#eab308',  // Yellow
      encroachment: '#a855f7', // Purple
      other: '#6b7280',        // Gray
    };
    const color = colors[category as keyof typeof colors] || colors.other;
    
    const pinSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
      </svg>
    `;
    return `data:image/svg+xml;utf-8,${encodeURIComponent(pinSvg)}`;
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

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Convert issues to heatmap points weighted by upvote count
  const heatmapData = issues
    .filter((issue) => issue.location && typeof issue.location.lat === 'number' && typeof issue.location.lng === 'number')
    .map((issue) => {
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        return {
          location: new window.google.maps.LatLng(issue.location.lat, issue.location.lng),
          weight: (issue.upvotes || 0) + 1,
        };
      }
      return null;
    })
    .filter((p) => p !== null) as google.maps.visualization.WeightedLocation[];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-50">
      <div className="h-[300px] md:h-[500px] w-full relative">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ lat: 12.9716, lng: 77.5946 }}
          zoom={12}
          options={{
            gestureHandling: 'cooperative',
            disableDefaultUI: false,
          }}
        >
          {/* Heatmap Overlay */}
          {window.google && showHeatmap === true && heatmapData.length > 0 && (
            <HeatmapLayer
              data={heatmapData}
              options={{
                radius: 30,
                opacity: 0.7,
              }}
            />
          )}

          {/* Custom Marker Pins & Clusterer */}
          {!showHeatmap && (
            <MarkerClusterer>
              {(clusterer) => (
                <>
                  {issues.map((issue) => {
                    if (!issue.location || typeof issue.location.lat !== 'number' || typeof issue.location.lng !== 'number') {
                      return null;
                    }
                    return (
                      <Marker
                        key={issue.id}
                        position={{ lat: issue.location.lat, lng: issue.location.lng }}
                        clusterer={clusterer}
                        icon={getCategoryMarkerIcon(issue.category)}
                        onClick={() => setSelectedIssue(issue)}
                      />
                    );
                  })}
                </>
              )}
            </MarkerClusterer>
          )}

          {/* InfoWindow */}
          {selectedIssue !== null && selectedIssue.location && (
            <InfoWindow
              position={{ lat: selectedIssue.location.lat, lng: selectedIssue.location.lng }}
              onCloseClick={() => setSelectedIssue(null)}
            >
              <div className="p-2 space-y-2 text-slate-800 max-w-[240px]">
                <h4 className="font-extrabold text-sm leading-snug">{selectedIssue.title}</h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[9px] font-black bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded text-primary-blue uppercase">
                    {selectedIssue.category}
                  </span>
                  <span className={`text-[9px] font-black border px-2 py-0.5 rounded uppercase ${getStatusBg(selectedIssue.status)}`}>
                    {selectedIssue.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Address: <span className="text-slate-700 font-bold">{selectedIssue.location.address || 'N/A'}</span>
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Reported by: <span className="text-slate-700 font-bold">{selectedIssue.reportedByName || 'Citizen Hero'}</span>
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  {formatDate(selectedIssue.createdAt)}
                </p>
                <button
                  onClick={() => {
                    onSelectIssue(selectedIssue);
                    setSelectedIssue(null);
                  }}
                  className="w-full mt-1.5 flex items-center justify-center bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-bold py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Live Issue Count Badge (Bottom-Left) */}
        <div className="absolute bottom-6 left-3 bg-white/95 backdrop-blur-xs border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-md z-10 flex items-center gap-1.5 pointer-events-none">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{issues.length} Live Issues</span>
        </div>

        {/* Heatmap Toggle Button (Top-Right overlay) */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer border flex items-center gap-1.5 ${
              showHeatmap
                ? 'bg-accent-orange border-accent-orange text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Flame className={`h-4 w-4 ${showHeatmap ? 'fill-white animate-bounce' : 'text-slate-500'}`} />
            <span>Heatmap Overlay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
