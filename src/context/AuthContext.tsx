import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { isFirebaseAvailable, auth, db } from '../firebase';
import { signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  selectInitialRole: (role: 'citizen' | 'authority') => Promise<void>;
  addPoints: (amount: number, reason: string) => Promise<void>;
  toggleRole: () => void;
  showNotification: (message: string, type: 'success' | 'info' | 'error') => void;
  logout: () => Promise<void>;
  notification: { message: string; type: 'success' | 'info' | 'error' } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BADGE_RULES = [
  { name: 'Active Citizen', points: 50 },
  { name: 'Pothole Patrol', points: 150 },
  { name: 'Civic Guardian', points: 300 },
  { name: 'Community Hero', points: 500 },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (isFirebaseAvailable && auth && db) {
      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const unsubscribeUser = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const syncedProfile: UserProfile = {
                uid: docSnap.id,
                name: data.name || 'Citizen Hero',
                email: data.email || '',
                photo: data.photo || '',
                role: data.role || '',
                points: data.points || 0,
                badges: data.badges || ['Newcomer'],
                reportedIssuesCount: data.reportedIssuesCount || 0,
                resolvedIssuesCount: data.resolvedIssuesCount || 0,
                rsvpCount: data.rsvpCount || 0,
                displayName: data.name || 'Citizen Hero',
                photoURL: data.photo || '',
                trustScore: data.trustScore || 0,
                isNewUser: data.role === '' || data.isNewUser,
                createdAt: data.createdAt || new Date().toISOString(),
              };
              setUser(syncedProfile);
              localStorage.setItem('community_hero_user', JSON.stringify(syncedProfile));
            }
            setLoading(false);
          });
          return () => unsubscribeUser();
        } else {
          setUser(null);
          localStorage.removeItem('community_hero_user');
          setLoading(false);
        }
      });
      return () => unsubscribeAuth();
    } else {
      const savedUser = localStorage.getItem('community_hero_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    }
  }, []);

  const calculateBadges = (points: number): string[] => {
    const badges = ['Newcomer'];
    BADGE_RULES.forEach((rule) => {
      if (points >= rule.points) {
        badges.push(rule.name);
      }
    });
    return badges;
  };

  const syncUser = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('community_hero_user', JSON.stringify(updated));
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (isFirebaseAvailable && auth && db) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const userCred = result.user;
        
        const docRef = doc(db, 'users', userCred.uid);
        const docSnap = await getDoc(docRef);
        
        let userProfile: UserProfile;
        if (docSnap.exists()) {
          const data = docSnap.data();
          userProfile = {
            uid: docSnap.id,
            name: data.name || userCred.displayName || 'Citizen Hero',
            displayName: data.name || userCred.displayName || 'Citizen Hero',
            email: data.email || userCred.email || '',
            photo: data.photo || userCred.photoURL || '',
            photoURL: data.photo || userCred.photoURL || '',
            role: data.role || '',
            points: data.points || 0,
            badges: data.badges || ['Newcomer'],
            reportedIssuesCount: data.reportedIssuesCount || 0,
            resolvedIssuesCount: data.resolvedIssuesCount || 0,
            rsvpCount: data.rsvpCount || 0,
            trustScore: data.trustScore || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            isNewUser: data.role === '' || !data.role
          };
        } else {
          userProfile = {
            uid: userCred.uid,
            name: userCred.displayName || 'Citizen Hero',
            displayName: userCred.displayName || 'Citizen Hero',
            email: userCred.email || '',
            photo: userCred.photoURL || '',
            photoURL: userCred.photoURL || '',
            role: '' as any,
            points: 0,
            badges: ['Newcomer'],
            reportedIssuesCount: 0,
            resolvedIssuesCount: 0,
            rsvpCount: 0,
            trustScore: 0,
            isNewUser: true,
            createdAt: new Date().toISOString()
          };
          await setDoc(docRef, {
            uid: userProfile.uid,
            name: userProfile.name,
            email: userProfile.email,
            photo: userProfile.photo,
            role: '',
            points: 0,
            badges: ['Newcomer'],
            reportedIssuesCount: 0,
            resolvedIssuesCount: 0,
            rsvpCount: 0,
            trustScore: 0,
            createdAt: userProfile.createdAt
          });
        }
        syncUser(userProfile);
        showNotification(`Welcome back, ${userProfile.name}!`, 'success');
      } else {
        const mockGoogleUser: UserProfile = {
          uid: 'mock_google_user_id',
          name: 'Rajesh Patel',
          displayName: 'Rajesh Patel (Mock)',
          email: 'rajesh.patel@community.in',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          role: '' as any,
          points: 0,
          badges: ['Newcomer'],
          reportedIssuesCount: 0,
          resolvedIssuesCount: 0,
          rsvpCount: 0,
          trustScore: 0,
          isNewUser: !localStorage.getItem('mock_google_role_chosen'),
          createdAt: new Date().toISOString()
        };
        syncUser(mockGoogleUser);
        showNotification('Signed in as Rajesh Patel (Mock Google)', 'success');
      }
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      showNotification(err.message || 'Google Auth failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectInitialRole = async (role: 'citizen' | 'authority') => {
    if (!user) return;
    const isAuthority = role === 'authority';
    const updatedUser: UserProfile = {
      ...user,
      role,
      isNewUser: false,
      displayName: isAuthority 
        ? (user.displayName.includes('Officer') ? user.displayName : `Officer ${user.displayName}`) 
        : user.displayName.replace('Officer ', ''),
      badges: isAuthority ? ['Officer Badge', 'Civic Guardian', 'Newcomer'] : ['Newcomer'],
    };

    syncUser(updatedUser);

    if (user.uid === 'mock_google_user_id') {
      localStorage.setItem('mock_google_role_chosen', 'true');
    }

    if (isFirebaseAvailable && db && user.uid !== 'mock_google_user_id') {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          role,
          name: updatedUser.displayName,
          badges: updatedUser.badges
        });
      } catch (err) {
        console.warn("Firestore selectInitialRole update failed:", err);
      }
    }

    showNotification(`Role updated to ${role === 'authority' ? 'Ward Officer' : 'Citizen Hero'}!`, 'success');
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseAvailable && auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn("Firebase signout failed.", e);
    }
    setUser(null);
    localStorage.removeItem('community_hero_user');
    localStorage.removeItem('mock_google_role_chosen');
    showNotification('Logged out successfully', 'info');
    setLoading(false);
  };

  const addPoints = async (amount: number, reason: string) => {
    if (!user) return;
    const newPoints = Math.max(0, user.points + amount);
    const newBadges = calculateBadges(newPoints);
    const addedBadges = newBadges.filter(b => !user.badges.includes(b));

    const updatedUser: UserProfile = {
      ...user,
      points: newPoints,
      badges: Array.from(new Set([...user.badges, ...newBadges])),
    };

    if (amount > 0) {
      updatedUser.rsvpCount = reason.includes('RSVP') ? user.rsvpCount + 1 : user.rsvpCount;
      updatedUser.reportedIssuesCount = reason.includes('Report') ? user.reportedIssuesCount + 1 : user.reportedIssuesCount;
      updatedUser.resolvedIssuesCount = reason.includes('Resolved') ? user.resolvedIssuesCount + 1 : user.resolvedIssuesCount;
    }

    syncUser(updatedUser);
    
    if (addedBadges.length > 0) {
      showNotification(`🎉 Congratulations! You earned the badge: ${addedBadges.join(', ')}!`, 'success');
    } else {
      showNotification(`${amount >= 0 ? '+' : ''}${amount} points for: ${reason}!`, 'success');
    }

    if (isFirebaseAvailable && db && user.uid !== 'mock_google_user_id') {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          points: newPoints,
          badges: updatedUser.badges,
          rsvpCount: updatedUser.rsvpCount,
          reportedIssuesCount: updatedUser.reportedIssuesCount,
          resolvedIssuesCount: updatedUser.resolvedIssuesCount,
        });
      } catch (err) {
        console.warn("Firestore user points update failed:", err);
      }
    }
  };

  const toggleRole = () => {
    if (!user) return;
    const newRole = user.role === 'citizen' ? 'authority' : 'citizen';
    const updatedUser: UserProfile = {
      ...user,
      role: newRole,
      displayName: newRole === 'authority'
        ? (user.displayName.includes('Officer') ? user.displayName : `Officer ${user.displayName}`)
        : user.displayName.replace('Officer ', '')
    };
    syncUser(updatedUser);
    showNotification(`Toggled view to ${newRole === 'authority' ? 'Ward Officer' : 'Citizen Hero'}`, 'info');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      logout,
      addPoints,
      toggleRole,
      notification,
      selectInitialRole,
      showNotification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
