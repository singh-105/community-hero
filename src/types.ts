export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  role: 'citizen' | 'authority';
  points: number;
  badges: string[];
  reportedIssuesCount: number;
  resolvedIssuesCount: number;
  rsvpCount: number;
  displayName: string; // compatibility mapping
  photoURL?: string; // compatibility mapping
  trustScore: number;
  isNewUser?: boolean;
  createdAt: string;
}

export type IssueCategory = 'pothole' | 'garbage' | 'water_leak' | 'streetlight' | 'encroachment' | 'other';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  role: 'citizen' | 'authority';
  text: string;
  timestamp: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  location: LocationData;
  imageURL?: string;
  imageUrl?: string; // compatibility mapping
  resolvedImageUrl?: string;
  status: 'reported' | 'assigned' | 'in_progress' | 'resolved';
  reportedBy: string; // user UID
  reportedByName: string;
  createdAt: string;
  reportedAt?: string; // compatibility mapping
  upvotes: number; // total upvote count
  upvotedBy: string[]; // array of user UIDs
  resolvedAt?: string;
  resolvedBy?: string; // name of officer
  resolutionNotes?: string;
  comments: Comment[];
}

export interface VolunteeringDrive {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  organizerName: string;
  volunteerCount: number;
  maxVolunteers: number;
  imageURL: string;
  volunteers: string[]; // array of user UIDs
}
