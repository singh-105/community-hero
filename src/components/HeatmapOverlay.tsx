import React, { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import type { Issue } from '../types';

interface HeatmapOverlayProps {
  issues: Issue[];
}

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({ issues }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (
      typeof google === 'undefined' ||
      !google.maps ||
      !google.maps.visualization ||
      !google.maps.visualization.HeatmapLayer
    ) {
      console.warn('Google Maps visualization library is not loaded yet.');
      return;
    }

    // Filter issues that have valid coordinates and map to LatLng objects
    const heatmapPoints = issues
      .filter((issue) => issue.location && typeof issue.location.lat === 'number' && typeof issue.location.lng === 'number')
      .map((issue) => ({
        location: new google.maps.LatLng(issue.location.lat, issue.location.lng),
        weight: (issue.upvotes || 0) + 1, // weights must be positive
      }));

    // Create the HeatmapLayer (casting to any to avoid type declaration mismatches)
    const heatmapLayer = new (google.maps.visualization.HeatmapLayer as any)({
      data: heatmapPoints,
      map: map,
      radius: 30, // adjust radius for better visualization contrast
      opacity: 0.7,
    });

    // Clean up heatmap layer on unmount or updates
    return () => {
      heatmapLayer.setMap(null);
    };
  }, [map, issues]);

  return null;
};
