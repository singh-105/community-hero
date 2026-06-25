import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { IssueCategory } from '../types';
import { AlertTriangle, Trash2, CheckCircle2, Hammer, MapPin, Camera, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

interface ReportWizardProps {
  onGoToFeed: () => void;
}

const CATEGORIES: { id: IssueCategory; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { id: 'pothole', label: 'Pothole & Road Damage', desc: 'Craters, road cracks, dangerous road breaks', icon: <AlertTriangle className="h-5 w-5" />, color: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/40 hover:border-rose-300' },
  { id: 'garbage', label: 'Garbage & Littering', desc: 'Unattended waste piles, commercial plastic dumps', icon: <Trash2 className="h-5 w-5" />, color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/40 hover:border-emerald-300' },
  { id: 'water_leak', label: 'Water Leakage', desc: 'Burst public pipes, sewage water leaks', icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/40 hover:border-blue-300' },
  { id: 'streetlight', label: 'Streetlight Blackout', desc: 'Dark zones, faulty/dim public poles', icon: <Hammer className="h-5 w-5" />, color: 'bg-yellow-50 border-yellow-200 text-yellow-750 hover:bg-yellow-100/40 hover:border-yellow-305' },
  { id: 'encroachment', label: 'Encroachment', desc: 'Blocked footpaths, illegal street boards', icon: <AlertTriangle className="h-5 w-5" />, color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/40 hover:border-indigo-300' },
  { id: 'other', label: 'Other Civic Grievance', desc: 'Drain blockage, stray dog pack reports', icon: <AlertTriangle className="h-5 w-5" />, color: 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/40 hover:border-slate-300' },
];

const LABEL_MAP: Record<IssueCategory, string> = {
  pothole: 'Dangerous pothole on road',
  garbage: 'Unattended commercial trash pile',
  water_leak: 'Major water leakage from main pipeline',
  streetlight: 'Faulty streetlight making street dark',
  encroachment: 'Footpath encroached by shop vendor boards',
  other: 'Civic issue in neighborhood',
};



export const ReportWizard: React.FC<ReportWizardProps> = ({ onGoToFeed }) => {
  const { reportIssue } = useApp();
  const { user, showNotification } = useAuth();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<IssueCategory>('pothole');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Step 3 fields — pre-populate title from category, user can override
  const [title, setTitle] = useState(LABEL_MAP['pothole']);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [reportId, setReportId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step3Error, setStep3Error] = useState<string | null>(null);

  // When category changes on step 1, keep title in sync
  const handleCategoryChange = (cat: IssueCategory) => {
    setCategory(cat);
    setTitle(LABEL_MAP[cat]);
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Title is already synced with category; just advance
      setStep(2);
    } else if (step === 2) {
      // Photo is required — button is disabled if no file, but guard anyway
      if (!selectedFile) return;
      setStep(3);
    } else if (step === 3) {
      // Validate all step-3 fields before allowing advance
      if (!title.trim()) {
        setStep3Error('Please enter a complaint title.');
        return;
      }
      if (!address.trim()) {
        setStep3Error('Please enter the location address.');
        return;
      }
      if (!description.trim()) {
        setStep3Error('Please enter a description of the issue.');
        return;
      }
      setStep3Error(null);
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setStep3Error(null);
    setStep(step - 1);
  };

  const resetForm = () => {
    setStep(1);
    setCategory('pothole');
    setTitle(LABEL_MAP['pothole']);
    setDescription('');
    setAddress('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsFinished(false);
    setReportId('');
    setErrorMsg(null);
    setStep3Error(null);
  };

  const handleFinalSubmit = async () => {
    // Final guard — all three fields must be non-empty
    if (!title.trim() || !description.trim() || !address.trim()) {
      setErrorMsg('Title, address, and description are all required. Please go back and fill them in.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    let uploadedUrl = '';

    try {
      if (selectedFile) {
        uploadedUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }

      const newId = await reportIssue(title, description, category, address, uploadedUrl);
      setReportId(newId);
      setIsFinished(true);
    } catch (err: any) {
      console.error('Submit failed:', err);
      const msg = err.message || 'Failed to submit report. Please check your connection and try again.';
      setErrorMsg(msg);
      if (showNotification) showNotification(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md text-center py-12 px-4">
        <Sparkles className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h2 className="font-bold text-slate-800 text-lg">Action Required</h2>
        <p className="text-slate-500 text-sm mt-2">
          You need to sign in to report a civic complaint and earn points. Please log in using the buttons in the navigation bar.
        </p>
      </div>
    );
  }

  if (isFinished) {
    const selectedCat = CATEGORIES.find(c => c.id === category);
    return (
      <div className="mx-auto max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg animate-scale-up mt-6 space-y-6">
        <div className="success-checkmark py-4">
          <div className="check-icon">
            <span className="icon-line line-tip"></span>
            <span className="icon-line line-long"></span>
            <div className="icon-circle"></div>
            <div className="icon-fix"></div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-extrabold text-slate-800 text-xl tracking-tight">Issue Reported Successfully! 🎉</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            Your complaint has been successfully registered, pinned on the Civic Hotspot Map, and dispatched to Ward Inspectors.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title</span>
            <span className="text-[10px] font-black text-primary-blue bg-blue-50 border border-blue-200/50 px-2.5 py-0.5 rounded-full uppercase">
              {selectedCat?.label || category}
            </span>
          </div>
          <p className="font-extrabold text-slate-800 text-sm leading-snug">{title}</p>
          <div className="flex justify-between text-xs font-bold text-slate-500 pt-1.5 border-t border-slate-100">
            <span>Reference ID:</span>
            <span className="font-mono text-slate-700 select-all">{reportId}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 flex flex-col items-center justify-center space-y-0.5">
          <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Civic Action Reward</span>
          <span className="text-2xl font-black text-amber-700">+50 Points</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <button onClick={resetForm} className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white text-sm font-bold py-3 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 text-center block">
            Report Another
          </button>
          <button onClick={onGoToFeed} className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold py-3 transition-all cursor-pointer active:scale-95 text-center block rounded-xl">
            Go to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">

      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center flex-1 last:flex-initial">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs border ${
              step >= i ? 'bg-primary-blue border-primary-blue text-white' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              {i}
            </div>
            {i < 4 && (
              <div className={`h-0.5 flex-1 mx-2 ${step > i ? 'bg-primary-blue' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">

        {/* STEP 1: CATEGORY SELECTION */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Select Complaint Category</h2>
              <p className="text-slate-400 text-xs mt-1">Select the civic issue category to file under</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                    category === cat.id
                      ? 'border-primary-blue ring-1 ring-primary-blue bg-blue-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${category === cat.id ? 'bg-primary-blue text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {cat.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{cat.label}</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5 leading-snug line-clamp-2">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: EVIDENCE UPLOAD */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Provide Photo Evidence</h2>
              <p className="text-slate-400 text-xs mt-1">Upload a photo of the issue from your device.</p>
            </div>

            <div className="pt-2">
              <label className="flex flex-col items-center justify-center aspect-video w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-primary-blue transition-all cursor-pointer overflow-hidden group">
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <img src={previewUrl} alt="Preview of uploaded proof" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="h-8 w-8 text-white" />
                      <span className="text-white text-xs font-bold ml-1.5">Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 text-slate-400 group-hover:text-primary-blue transition-colors mb-3">
                      <Camera className="h-6 w-6" />
                    </div>
                    <span className="text-slate-700 text-xs font-bold block">Upload Image Proof</span>
                    <span className="text-slate-400 text-[10px] block mt-1">Click to browse your device files (PNG, JPG, HEIC)</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!selectedFile}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION & DETAILS */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Define Address & Details</h2>
              <p className="text-slate-400 text-xs mt-1">Specify complaint location and write description details</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Complaint Title Summary</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-50/70 focus:bg-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-accent-orange animate-pulse" /> Local Landmark Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 2nd cross road, Koramangala 1st Block"
                className="w-full bg-slate-50 hover:bg-slate-50/70 focus:bg-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description (What needs fixing?)</label>
              <textarea
                required
                rows={3}
                placeholder="Include landmark details or exact location markers to help speed up verification by the ward inspectors..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-50/70 focus:bg-white text-xs font-semibold p-3 rounded-xl border border-slate-200 focus:border-primary-blue focus:ring-1 focus:ring-primary-blue outline-none transition-all"
              />
            </div>

            {/* Inline validation error for step 3 */}
            {step3Error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{step3Error}</span>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SUBMIT */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Verify Report Details</h2>
              <p className="text-slate-400 text-xs mt-1">Review details before sending to the Ward Inspector</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-blue/15 text-primary-blue border border-primary-blue/10 uppercase">
                  {category}
                </span>
                <span className="text-xs font-bold text-slate-400">Step 4 of 4</span>
              </div>
              <h3 className="font-bold text-slate-800 text-base">{title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{description}</p>
              <div className="border-t border-slate-200/50 pt-2 flex items-start gap-1 text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-xs font-bold line-clamp-1">{address}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-accent-orange">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-800 block">Civic Contributor Points</span>
                  <span className="text-[10px] text-amber-600 block">Rewarded upon filing review</span>
                </div>
              </div>
              <span className="text-lg font-extrabold text-amber-700">+50 Points</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="flex items-center gap-1 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-blue hover:bg-primary-blue-hover text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & File Report</span>
                    <Sparkles className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};