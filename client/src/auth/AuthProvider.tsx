import { useState } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        // Returns true if a token exists to restore the previous session
        return !!localStorage.getItem('token');
    });

    const [userName, setUserName] = useState<string | null>(() => {
        // Retrieves the stored username from localStorage if available
        return localStorage.getItem('userName');
    });

    const login = (token: string, name?: string | null) => {
        localStorage.setItem('token', token);
        if (name) {
            localStorage.setItem('userName', name);
            setUserName(name);
        } else {
            localStorage.removeItem('userName');
            setUserName(null);
        }
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        setUserName(null);
    };

    return (
        // Supplies the authentication context value to all nested consumer components
        <AuthContext.Provider value={{ isLoggedIn, userName, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};