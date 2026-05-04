import { createContext } from "react";

// Defines the shape of the User object to store credentials and role information
export interface User {
  id: string;
  email: string;
  role: string;
  username?: string | null; // This allows us to store the new username
}

// Defines the structural contract for the authentication state and its associated methods
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  // Add setUser here so components can update the global user state
  setUser: (user: User | null) => void;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
