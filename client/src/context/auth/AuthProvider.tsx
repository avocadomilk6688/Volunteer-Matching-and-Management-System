import { useState } from "react";
import { AuthContext } from "./AuthContext";

interface User {
    id: string;
    email: string;
    role: string;
    name?: string | null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        // Returns true if a token exists to restore the previous session
        return !!localStorage.getItem('token');
    });

    const [user, setUser] = useState<User | null>(() => {
        // Retrieves the stored username from localStorage if available
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.clear();
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        // Supplies the authentication context value to all nested consumer components
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};