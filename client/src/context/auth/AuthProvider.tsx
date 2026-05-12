import React, { useState } from "react";
import { AuthContext, type User } from "./AuthContext";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Check if we have a token to set initial auth state
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem('token');
    });

    // 2. Hydrate user state from LocalStorage on load
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        // CRITICAL: Saves the full object with volunteer/organization relations
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.clear(); // Wipe everything
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, setUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};