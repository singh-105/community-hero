import React, { useState } from 'react';
import type { VolunteeringDrive } from '../types';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Calendar, MapPin, Users, Check, Flame, ArrowRight, ShieldCheck } from 'lucide-react';
import { CivicImage } from './CivicImage';

export const DrivesSection: React.FC = () => {
  const { user } = useAuth();
  const { drives, rsvpDrive, loading } = useApp();
  const [selectedDrive, setSelectedDrive] = useState<VolunteeringDrive | null>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getAttendeeName = (uid: string) => {
    if (user && uid === user.uid) return user.name || user.displayName || 'Citizen Hero';
    return 'Citizen Hero';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="h-8 w-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mb-2"></div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Drives...</span>
      </div>
    );
  }

  // Find updated drive in live list to keep modal fresh
  const activeDrive = selectedDrive ? (drives.find(d => d.id === selectedDrive.id) || selectedDrive) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header and intro */}
      <div className="mb-8">
        <h1 className="font-extrabold text-slate-800 text-2xl sm:text-3xl flex items-center gap-2">
          <Flame className="h-6 w-6 text-accent-orange animate-pulse" />
          Community Volunteering Drives
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Join local neighborhood clean-up drives, tree plantations, and lake restoration campaigns. Earn points and meet active neighbors!
        </p>
      </div>

      {/* Grid */}
      {drives.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-bold shadow-xs flex flex-col items-center justify-center space-y-3">
          <div className="p-4 rounded-full bg-orange-50 text-accent-orange">
            <Flame className="h-10 w-10 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">No drives scheduled yet</h3>
            <p className="text-slate-400 text-xs mt-1">Check back soon for upcoming neighborhood clean-up campaigns!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drives.map((drive) => {
            const volunteersList = drive.volunteers || [];
            const isAttending = user ? volunteersList.includes(user.uid) : false;
            
            return (
              <div 
                key={drive.id} 
                onClick={() => setSelectedDrive(drive)}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                {/* Media image */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <CivicImage 
                    src={drive.imageURL} 
                    alt={drive.title} 
                    category="drive"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  
                  {/* Points tag */}
                  <div className="absolute top-3 left-3 bg-amber-500/90 text-white backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 fill-white" />
                    <span>+100 Points</span>
                  </div>

                  {/* Status tag */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider bg-white/90 border border-slate-200/50 text-slate-700 shadow-xs">
                      Upcoming
                    </span>
                  </div>
                </div>

                {/* Contents */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-primary-blue transition-colors">
                      {drive.title}
                    </h3>
                    
                    <p className="mt-2 text-slate-500 text-xs leading-relaxed line-clamp-3">
                      {drive.description}
                    </p>

                    {/* Logistics grid */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-600 border-t border-slate-100 pt-3.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary-blue shrink-0" />
                        {formatDate(drive.date)}
                      </span>
                      <span className="flex items-center gap-1.5 sm:col-span-2 mt-1">
                        <MapPin className="h-4 w-4 text-accent-orange shrink-0" />
                        <span className="truncate">{drive.location}</span>
                      </span>
                    </div>
                  </div>

                  {/* Footer RSVP Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    {/* Attendees Count */}
                    <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>{drive.volunteerCount || 0} attending</span>
                    </div>

                    {/* Action Button */}
                    {user ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          rsvpDrive(drive.id);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer active:scale-95 ${
                          isAttending
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {isAttending ? (
                          <>
                            <Check className="h-4 w-4 stroke-[3]" />
                            <span>Joined Drive</span>
                          </>
                        ) : (
                          <>
                            <span>RSVP & Join</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold italic">Sign in to join drive</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Notice */}
      <div className="mt-8 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex gap-3 items-start">
        <ShieldCheck className="h-5 w-5 text-primary-blue shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600">
          <span className="font-bold text-slate-800 block">Volunteer Safety Guidelines</span>
          Please bring personal drinking water, wear closed shoes (sports shoes/boots), and hats. Safety vests, hand sanitizer, trashbags, and gloves are distributed at the gate by organizers before assembly.
        </div>
      </div>

      {/* Drive Detail Modal Overlay */}
      {activeDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            {/* Modal Image Header */}
            <div className="relative aspect-video w-full bg-slate-100">
              <CivicImage 
                src={activeDrive.imageURL} 
                alt={activeDrive.title} 
                category="drive"
                className="h-full w-full object-cover" 
              />
              <button
                onClick={() => setSelectedDrive(null)}
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-slate-900/60 text-white flex items-center justify-center font-bold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                ✕
              </button>
              <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                +100 Points
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xl leading-tight">{activeDrive.title}</h3>
                <span className="mt-1 px-2.5 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-700 inline-block">
                  Status: Upcoming
                </span>
              </div>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{activeDrive.description}</p>

              {/* Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary-blue" />
                  Date: {formatDate(activeDrive.date)}
                </span>
                <span className="flex items-center gap-1.5 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-accent-orange shrink-0" />
                  Location: {activeDrive.location}
                </span>
              </div>

              {/* Organizer details */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Organizer Contact</span>
                <div className="text-xs font-semibold text-slate-700">
                  <span className="block font-bold">{activeDrive.organizerName}</span>
                </div>
              </div>

              {/* Attendees volunteer list */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Registered Volunteers ({activeDrive.volunteerCount || 0})</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {(!activeDrive.volunteers || activeDrive.volunteers.length === 0) ? (
                    <span className="text-xs text-slate-400 font-semibold italic">No volunteers registered yet. Join them!</span>
                  ) : (
                    activeDrive.volunteers.map((uid) => (
                      <span key={uid} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 border border-blue-100 text-primary-blue flex items-center gap-1">
                        <div className="h-4 w-4 rounded-full bg-primary-blue text-white flex items-center justify-center text-[8px] font-black uppercase">
                          {getAttendeeName(uid).charAt(0)}
                        </div>
                        {getAttendeeName(uid)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* RSVP Action */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {user ? (
                  <>
                    <span className="text-xs font-semibold text-slate-500">
                      {(activeDrive.volunteers || []).includes(user.uid) 
                        ? "You are registered for this event."
                        : "Join this event to contribute and earn points!"}
                    </span>
                    <button
                      onClick={() => {
                        rsvpDrive(activeDrive.id);
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer active:scale-95 ${
                        (activeDrive.volunteers || []).includes(user.uid)
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {(activeDrive.volunteers || []).includes(user.uid) ? (
                        <>
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>Joined Drive</span>
                        </>
                      ) : (
                        <>
                          <span>RSVP & Join</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold italic">Please sign in to register for this event.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
