import { createContext } from "react";

// Defines the shape of the User object to store credentials and role information
interface User {
  id: string;
  email: string;
  role: string;
  name?: string | null;
}

// Defines the structural contract for the authentication state and its associated methods
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
