import { createContext } from "react";

export interface User {
  id: string;
  email: string;
  role: "admin" | "volunteer" | "organization";
  username?: string | null;

  // These allow the nested data from TypeORM relations to exist in React
  volunteer?: {
    profile_picture_url?: string;
    rating?: number;
    points?: number;
  };
  organization?: {
    profile_picture_url?: string;
    description?: string;
    rating?: number;
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
