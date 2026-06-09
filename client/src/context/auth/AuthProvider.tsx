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
        localStorage.setItem('userId', userData.id); // Ensure we track userId separately for reliable key access
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        // ─── 🌟 FIXED: SELECTIVE WIPE PROTECTS CHAT/NOTIFICATION STATES ───
        // Instead of localStorage.clear(), we only remove auth-related keys.
        // This keeps 'last_viewed_chat_time_*' and 'last_viewed_notifications_time_*' 
        // keys safe for all users in the browser.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');

        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, setUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};