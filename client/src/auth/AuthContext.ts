import { createContext } from 'react';


// Define the structural contract for the authentication state and its associated methods.
interface AuthContextType {
    isLoggedIn: boolean;
    userName: string | null;
    login: (token: string, name?: string | null) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);