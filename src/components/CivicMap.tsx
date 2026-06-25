import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { isFirebaseAvailable, db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Flame } from 'lucide-react';
import type { Issue } from '../types';
import { HeatmapOverlay } from './HeatmapOverlay';

interface CivicMapProps {
  onSelectIssue: (issue: Issue) => void;
  issues?: Issue[];
}

interface MarkerClustererComponentProps {
  issues: Issue[];
  setSelectedPin: (issue: Issue | null) => void;
}

const MarkerClustererComponent: React.FC<MarkerClustererComponentProps> = ({ issues, setSelectedPin }) => {
  const map = useMap();
  const [markers, setMarkers] = useState<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  // Initialize marker clusterer
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  // Sync clusterer markers
  useEffect(() => {
    if (!clusterer.current) return;
    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
    if (marker) {
      setMarkers((prev) => {
        if (prev[key] === marker) return prev;
        return { ...prev, [key]: marker };
      });
    } else {
      setMarkers((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pothole':
        return { bg: '#ef4444', border: '#b91c1c', glyph: '#fff' }; // Red
      case 'water_leak':
        return { bg: '#3b82f6', border: '#1d4ed8', glyph: '#fff' }; // Blue
      case 'garbage':
        return { bg: '#10b981', border: '#047857', glyph: '#fff' }; // Green
      case 'streetlight':
        return { bg: '#eab308', border: '#a16207', glyph: '#fff' }; // Yellow
      case 'encroachment':
        return { bg: '#a855f7', border: '#7e22ce', glyph: '#fff' }; // Purple
      default:
        return { bg: '#6b7280', border: '#374151', glyph: '#fff' }; // Gray
    }
  };

  return (
    <>
      {issues.map((issue) => {
        if (!issue.location || typeof issue.location.lat !== 'number' || typeof issue.location.lng !== 'number') {
          return null;
        }
        const colors = getCategoryColor(issue.category);
        return (
          <AdvancedMarker
            key={issue.id}
            position={{ lat: issue.location.lat, lng: issue.location.lng }}
            ref={(marker) => setMarkerRef(marker, issue.id)}
            onClick={() => setSelectedPin(issue)}
          >
            <Pin
              background={colors.bg}
              borderColor={colors.border}
              glyphColor={colors.glyph}
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
};

export const CivicMap: React.FC<CivicMapProps> = ({ onSelectIssue, issues: propIssues }) => {
  const [issues, setIssues] = useState<Issue[]>(propIssues || []);
  const [selectedPin, setSelectedPin] = useState<Issue | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

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
            location: data.location || { lat: 19.0760, lng: 72.8777, address: '' },
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

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-50">
      <div className="h-[300px] md:h-[500px] w-full relative">
        <APIProvider
          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          libraries={['visualization', 'places']}
        >
          <Map
            defaultCenter={{ lat: 19.0760, lng: 72.8777 }}
            defaultZoom={12}
            mapId="DEMO_MAP_ID"
            gestureHandling="cooperative"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Heatmap Overlay */}
            {heatmapEnabled && <HeatmapOverlay issues={issues} />}

            {/* Custom Marker Pins & Clusterer */}
            {!heatmapEnabled && (
              <MarkerClustererComponent
                issues={issues}
                setSelectedPin={setSelectedPin}
              />
            )}

            {/* InfoWindow */}
            {selectedPin && selectedPin.location && (
              <InfoWindow
                position={{ lat: selectedPin.location.lat, lng: selectedPin.location.lng }}
                onCloseClick={() => setSelectedPin(null)}
              >
                <div className="p-2 space-y-2 text-slate-800 max-w-[240px]">
                  <h4 className="font-extrabold text-sm leading-snug">{selectedPin.title}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[9px] font-black bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded text-primary-blue uppercase">
                      {selectedPin.category}
                    </span>
                    <span className={`text-[9px] font-black border px-2 py-0.5 rounded uppercase ${getStatusBg(selectedPin.status)}`}>
                      {selectedPin.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Reported by: <span className="text-slate-700 font-bold">{selectedPin.reportedByName || 'Citizen Hero'}</span>
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">
                    {formatDate(selectedPin.createdAt)}
                  </p>
                  <button
                    onClick={() => {
                      onSelectIssue(selectedPin);
                      setSelectedPin(null);
                    }}
                    className="w-full mt-1.5 flex items-center justify-center bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-bold py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Live Issue Count Badge (Bottom-Left) */}
        <div className="absolute bottom-6 left-3 bg-white/95 backdrop-blur-xs border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-md z-10 flex items-center gap-1.5 pointer-events-none">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{issues.length} Live Issues</span>
        </div>

        {/* Heatmap Toggle Button (Top-Right overlay) */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setHeatmapEnabled(!heatmapEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer border flex items-center gap-1.5 ${
              heatmapEnabled
                ? 'bg-accent-orange border-accent-orange text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Flame className={`h-4 w-4 ${heatmapEnabled ? 'fill-white animate-bounce' : 'text-slate-500'}`} />
            <span>Heatmap Overlay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
