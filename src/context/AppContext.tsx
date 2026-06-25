import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Issue, VolunteeringDrive, UserProfile, Comment, IssueCategory } from '../types';
import { useAuth } from './AuthContext';
import { isFirebaseAvailable, db } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface AppContextType {
  issues: Issue[];
  drives: VolunteeringDrive[];
  leaderboard: UserProfile[];
  loading: boolean;
  reportIssue: (title: string, description: string, category: IssueCategory, address: string, imageURL?: string) => Promise<string>;
  upvoteIssue: (issueId: string) => Promise<void>;
  updateIssueStatus: (issueId: string, status: 'assigned' | 'in_progress' | 'resolved', notes?: string, resolvedImageUrl?: string) => Promise<void>;
  rsvpDrive: (driveId: string) => Promise<void>;
  addComment: (issueId: string, text: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SAMPLE_DRIVES = [
  {
    title: 'Madiwala Lake Bed Plastic Cleanup',
    description: 'Help us clear plastic wrappers, single-use cups, and floating garbage from the banks of Madiwala Lake. Refreshments, gloves, and trash bags will be provided.',
    location: 'Madiwala Lake Entrance Park, Bengaluru',
    date: '2026-07-05',
    organizerName: 'Eco-Guardians Bengaluru',
    volunteerCount: 0,
    maxVolunteers: 50,
    imageURL: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=800&q=80',
    volunteers: []
  },
  {
    title: 'HSR Sector 2 Urban Afforestation Drive',
    description: 'We aim to plant 50 native saplings along the service roads. Bring a spade if you have one! Saplings and manure provided.',
    location: 'Outer Ring Road Service Lane, HSR Sector 2, Bengaluru',
    date: '2026-07-12',
    organizerName: 'SayTrees Citizen Group',
    volunteerCount: 0,
    maxVolunteers: 30,
    imageURL: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    volunteers: []
  },
  {
    title: 'Indiranagar Double Road Spot-Fixing',
    description: 'Painting walls, clearing illegal posters, and planting shrubs on a neglected garbage black spot. Let\'s beautify our ward!',
    location: 'Double Road corner, Indiranagar, Bengaluru',
    date: '2026-07-19',
    organizerName: 'Ugly Indian Volunteers',
    volunteerCount: 0,
    maxVolunteers: 25,
    imageURL: 'https://images.unsplash.com/photo-1599740831464-5cbe1a146747?auto=format&fit=crop&w=800&q=80',
    volunteers: []
  }
];

// Safe wrapper — addPoints failure never blocks the caller
const safeAddPoints = async (addPoints: (a: number, r: string) => Promise<void>, amount: number, reason: string) => {
  try {
    await addPoints(amount, reason);
  } catch (err) {
    console.warn('addPoints failed (non-critical):', err);
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, addPoints } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [drives, setDrives] = useState<VolunteeringDrive[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);

  const [loadingIssues, setLoadingIssues] = useState(true);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const loading = loadingIssues || loadingDrives || loadingLeaderboard;

  useEffect(() => {
    if (isFirebaseAvailable && db) {
      const unsubscribeIssues = onSnapshot(collection(db, 'issues'), (snapshot) => {
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
            reportedAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
            upvotes: data.upvotes || 0,
            upvotedBy: data.upvotedBy || [],
            resolvedAt: data.resolvedAt || '',
            resolvedBy: data.resolvedBy || '',
            resolutionNotes: data.resolutionNotes || '',
            comments: data.comments || []
          } as Issue);
        });
        issuesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setIssues(issuesList);
        setLoadingIssues(false);
      }, (error) => {
        console.error("Issues listener error:", error);
        setLoadingIssues(false);
      });

      let isSeeding = false;
      const unsubscribeDrives = onSnapshot(collection(db, 'drives'), async (snapshot) => {
        if (snapshot.empty && !isSeeding) {
          isSeeding = true;
          try {
            const drivesCol = collection(db, 'drives');
            for (const drive of SAMPLE_DRIVES) {
              await setDoc(doc(drivesCol), drive);
            }
          } catch (err) {
            console.warn("Failed to seed drives:", err);
          } finally {
            isSeeding = false;
          }
        } else {
          const drivesList: VolunteeringDrive[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            drivesList.push({
              id: docSnap.id,
              title: data.title || '',
              description: data.description || '',
              location: data.location || '',
              date: data.date || '',
              organizerName: data.organizerName || '',
              volunteerCount: data.volunteerCount || 0,
              maxVolunteers: data.maxVolunteers || 0,
              imageURL: data.imageURL || '',
              volunteers: data.volunteers || []
            } as VolunteeringDrive);
          });
          setDrives(drivesList);
          setLoadingDrives(false);
        }
      }, (error) => {
        console.error("Drives listener error:", error);
        setLoadingDrives(false);
      });

      const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersList: UserProfile[] = [];
        snapshot.forEach((uDoc) => {
          const data = uDoc.data();
          if (data.role) {
            usersList.push({
              uid: uDoc.id,
              name: data.name || 'Citizen Hero',
              displayName: data.name || 'Citizen Hero',
              email: data.email || '',
              photo: data.photo || '',
              photoURL: data.photo || '',
              role: data.role || 'citizen',
              points: data.points || 0,
              badges: data.badges || ['Newcomer'],
              reportedIssuesCount: data.reportedIssuesCount || 0,
              resolvedIssuesCount: data.resolvedIssuesCount || 0,
              rsvpCount: data.rsvpCount || 0,
              trustScore: data.trustScore || 0,
              createdAt: data.createdAt || new Date().toISOString()
            } as UserProfile);
          }
        });
        usersList.sort((a, b) => b.points - a.points);
        setLeaderboard(usersList.slice(0, 10));
        setLoadingLeaderboard(false);
      }, (error) => {
        console.error("Leaderboard listener error:", error);
        setLoadingLeaderboard(false);
      });

      return () => {
        unsubscribeIssues();
        unsubscribeDrives();
        unsubscribeUsers();
      };
    } else {
      setLoadingIssues(false);
      setLoadingDrives(false);
      setLoadingLeaderboard(false);
    }
  }, []);

  const reportIssue = async (
    title: string,
    description: string,
    category: IssueCategory,
    address: string,
    imageURL?: string
  ): Promise<string> => {
    if (!user) throw new Error("User must be signed in.");

    const baseLat = 12.9716;
    const baseLng = 77.5946;
    const offsetLat = (Math.random() - 0.5) * 0.08;
    const offsetLng = (Math.random() - 0.5) * 0.08;

    if (isFirebaseAvailable && db) {
      const issuesCol = collection(db, 'issues');
      const docRef = doc(issuesCol);

      // setDoc and addPoints are separated — points failure never kills the submit
      await setDoc(docRef, {
        title,
        description,
        category,
        location: { lat: baseLat + offsetLat, lng: baseLng + offsetLng, address },
        imageURL: imageURL || '',
        imageUrl: imageURL || '',
        status: 'reported',
        reportedBy: user.uid,
        reportedByName: user.name || user.displayName || 'Citizen Hero',
        createdAt: serverTimestamp(),
        upvotes: 0,
        upvotedBy: [] as string[],
        comments: [] as Comment[]
      });

      // Non-blocking — if this fails, issue is already saved, return succeeds
      await safeAddPoints(addPoints, 50, `Reporting Issue: ${title}`);

      return docRef.id;

    } else {
      // Mock fallback
      const mockId = 'issue_' + Math.random().toString(36).substr(2, 9);
      const mockIssue: Issue = {
        id: mockId,
        title,
        description,
        category,
        location: { lat: baseLat + offsetLat, lng: baseLng + offsetLng, address },
        imageURL: imageURL || '',
        imageUrl: imageURL || '',
        resolvedImageUrl: '',
        status: 'reported',
        reportedBy: user.uid,
        reportedByName: user.name || 'Citizen Hero',
        createdAt: new Date().toISOString(),
        reportedAt: new Date().toISOString(),
        upvotes: 0,
        upvotedBy: [],
        resolvedAt: '',
        resolvedBy: '',
        resolutionNotes: '',
        comments: []
      };
      setIssues(prev => [mockIssue, ...prev]);
      await safeAddPoints(addPoints, 50, `Reporting Issue: ${title}`);
      return mockId;
    }
  };

  const upvoteIssue = async (issueId: string) => {
    if (!user) return;
    if (!isFirebaseAvailable || !db) return;

    const issueRef = doc(db, 'issues', issueId);
    try {
      const issueSnap = await getDoc(issueRef);
      if (!issueSnap.exists()) return;

      const issueData = issueSnap.data() as Issue;
      const upvotedByList = issueData.upvotedBy || [];
      const hasUpvoted = upvotedByList.includes(user.uid);

      const newUpvotedBy = hasUpvoted
        ? upvotedByList.filter(uid => uid !== user.uid)
        : [...upvotedByList, user.uid];
      const newCount = hasUpvoted
        ? Math.max(0, (issueData.upvotes || 0) - 1)
        : (issueData.upvotes || 0) + 1;

      await updateDoc(issueRef, { upvotedBy: newUpvotedBy, upvotes: newCount });
      await safeAddPoints(
        addPoints,
        hasUpvoted ? -10 : 10,
        hasUpvoted ? 'Removed support vote' : `Supporting issue: ${issueData.title}`
      );
    } catch (err) {
      console.error("Failed to upvote issue:", err);
    }
  };

  const updateIssueStatus = async (
    issueId: string,
    status: 'assigned' | 'in_progress' | 'resolved',
    notes?: string,
    resolvedImageUrl?: string
  ) => {
    if (!user || !isFirebaseAvailable || !db) return;

    const issueRef = doc(db, 'issues', issueId);
    try {
      const updatePayload: any = { status };
      if (status === 'resolved') {
        updatePayload.resolvedAt = new Date().toISOString();
        updatePayload.resolvedBy = user.name || user.displayName;
        updatePayload.resolutionNotes = notes || 'Resolved by BBMP Ward Engineering Cell.';
        updatePayload.resolvedImageUrl = resolvedImageUrl || '';
      }
      await updateDoc(issueRef, updatePayload);
      await safeAddPoints(
        addPoints,
        status === 'resolved' ? 100 : 20,
        status === 'resolved' ? `Resolving issue #${issueId.slice(-4)}` : `Status → ${status}`
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const rsvpDrive = async (driveId: string) => {
    if (!user || !isFirebaseAvailable || !db) return;

    const driveRef = doc(db, 'drives', driveId);
    try {
      const driveSnap = await getDoc(driveRef);
      if (!driveSnap.exists()) return;

      const driveData = driveSnap.data() as VolunteeringDrive;
      const volunteersList = driveData.volunteers || [];
      const isRegistered = volunteersList.includes(user.uid);

      const newVolunteers = isRegistered
        ? volunteersList.filter(uid => uid !== user.uid)
        : [...volunteersList, user.uid];
      const newCount = isRegistered
        ? Math.max(0, (driveData.volunteerCount || 0) - 1)
        : (driveData.volunteerCount || 0) + 1;

      await updateDoc(driveRef, { volunteers: newVolunteers, volunteerCount: newCount });
      await safeAddPoints(
        addPoints,
        isRegistered ? -100 : 100,
        isRegistered ? `Cancelled RSVP: ${driveData.title}` : `RSVP: ${driveData.title}`
      );
    } catch (err) {
      console.error("Failed to RSVP:", err);
    }
  };

  const addComment = async (issueId: string, text: string) => {
    if (!user || !isFirebaseAvailable || !db) return;

    const newComment: Comment = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      userName: user.name || user.displayName,
      role: user.role,
      text,
      timestamp: new Date().toISOString()
    };

    const issueRef = doc(db, 'issues', issueId);
    try {
      const issueSnap = await getDoc(issueRef);
      if (!issueSnap.exists()) return;
      const issueData = issueSnap.data() as Issue;
      await updateDoc(issueRef, { comments: [...(issueData.comments || []), newComment] });
      await safeAddPoints(addPoints, 5, 'Commenting on issue');
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const refreshData = async () => {};

  return (
    <AppContext.Provider value={{
      issues, drives, leaderboard, loading,
      reportIssue, upvoteIssue, updateIssueStatus,
      rsvpDrive, addComment, refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};