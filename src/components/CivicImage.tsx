import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, Hammer, Image as ImageIcon } from 'lucide-react';

interface CivicImageProps {
  src?: string;
  alt: string;
  category: string;
  className?: string;
}

export const CivicImage: React.FC<CivicImageProps> = ({ src, alt, category, className }) => {
  const [hasError, setHasError] = useState(!src);

  // Reset error state if src changes (e.g. when image gets uploaded)
  useEffect(() => {
    setHasError(!src);
  }, [src]);

  const getPlaceholder = (cat: string) => {
    switch (cat) {
      case 'water_leak':
        return { 
          bg: 'bg-blue-50 text-blue-600 border border-blue-200/50', 
          icon: <CheckCircle2 className="h-10 w-10 stroke-[2]" />,
          label: 'Water Leakage'
        };
      case 'pothole':
        return { 
          bg: 'bg-rose-50 text-rose-600 border border-rose-200/50', 
          icon: <AlertTriangle className="h-10 w-10 stroke-[2]" />,
          label: 'Pothole'
        };
      case 'garbage':
        return { 
          bg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50', 
          icon: <Trash2 className="h-10 w-10 stroke-[2]" />,
          label: 'Garbage Dump'
        };
      case 'streetlight':
        return { 
          bg: 'bg-yellow-50 text-yellow-700 border border-yellow-200/50', 
          icon: <Hammer className="h-10 w-10 stroke-[2]" />,
          label: 'Streetlight Out'
        };
      case 'drive':
        return {
          bg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/50',
          icon: <ImageIcon className="h-10 w-10 stroke-[2]" />,
          label: 'Volunteering Drive'
        };
      default:
        return { 
          bg: 'bg-slate-50 text-slate-500 border border-slate-200/50', 
          icon: <AlertTriangle className="h-10 w-10 stroke-[2]" />,
          label: 'Civic Issue'
        };
    }
  };

  const placeholder = getPlaceholder(category);

  if (hasError || !src) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center min-h-[140px] text-center p-4 ${placeholder.bg} ${className}`}>
        <div className="p-2.5 rounded-2xl bg-white/80 shadow-xs border border-white/60 mb-2">
          {placeholder.icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest leading-none block">
          {placeholder.label}
        </span>
        <span className="text-[9px] text-slate-400 font-bold block mt-1 uppercase tracking-wider">
          No Image Evidence
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};
