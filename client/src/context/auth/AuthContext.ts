import { createContext } from "react";

// ─── ADDED: PENDING RATING TRIGGER OBJECT TYPE CONTRACT ───
export interface PendingRatingTrigger {
  programmeId: string;
  organizationName: string;
  organizationLogo: string;
}

export interface User {
  id: string;
  email: string;
  role: "admin" | "volunteer" | "organization";
  username?: string | null;

  // ─── FIXED: ALLOWS AUTOMATED POPUPS TO BE ACCESSED NATIVELY BY THE FRONTEND COMPILER ───
  pendingRating?: PendingRatingTrigger | null;

  // These allow the nested data from TypeORM relations to exist in React
  volunteer?: {
    profile_picture_url?: string;
    rating?: number;
    points?: number;
  };
  organization?: {
    id: string;
    profile_picture_url?: string;
    description?: string;
    rating?: number;
    registrationRecord?: {
      status?: string;
    };
  };
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
