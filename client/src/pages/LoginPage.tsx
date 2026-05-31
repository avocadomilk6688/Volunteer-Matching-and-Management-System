import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import { Header } from './Header';
import { useState } from 'react';
import { useAuth } from '../context/auth/useAuth';
import './login_page.css';

const API_BASE_URL = "http://localhost:3000";

interface ProfileRelation {
    id: string; // E.g., O002
    profile_picture_url?: string;
    registrationRecord?: {
        id: string;
        status: string;
    };
}

interface LoginResponseData {
    access_token: string;
    id: string; // Core tracking ID (O002)
    username: string;
    role: 'admin' | 'volunteer' | 'organization';
    volunteer?: ProfileRelation;
    organization?: ProfileRelation;
    message?: string;
}

export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("volunteer");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            });

            const data = (await response.json()) as LoginResponseData;

            console.log("DEBUG: Full login response from server payload:", data);

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // ─── CRITICAL MISSING LINK FIXED ───
            // Explicitly persist the bearer authentication token inside localStorage.
            // This ensures ManageListingPage can fetch protected relations securely!
            localStorage.setItem('token', data.access_token);

            // Keeps your clean ID tracking completely intact inside local storage
            localStorage.setItem('userId', data.id);

            // ─── DATA STRUCTURE NORMALIZATION MATRIX ───
            const unifiedAuthUserContext = {
                ...data,
                id: data.id, // "O002"
                email: email,
                organization: data.organization ? {
                    ...data.organization,
                    id: data.organization.id || data.id
                } : undefined
            };

            // Propagate normalized data representation to Context
            login(data.access_token, unifiedAuthUserContext);

            // ─── NAV INTERCEPTOR LOGIC MATRIX ───
            if (role === 'volunteer') {
                navigate('/volunteer-home');
            } else if (role === 'admin') {
                navigate('/manage-user-account');
            } else if (role === 'organization') {

                // Safely extract approval status out of the nested registrationRecord relation object
                const rawStatus = data.organization?.registrationRecord?.status || 'pending';
                const registrationStatus = rawStatus.trim().toLowerCase();

                console.log("DEBUG: Normalized registration status evaluation:", registrationStatus);

                if (registrationStatus === 'approved') {
                    // Approved organizations bypass the lockout banner and hit operational features smoothly
                    navigate('/manage-listing');
                } else if (registrationStatus === 'pending') {
                    // Explicitly pending accounts stay securely contained
                    navigate('/pending-approval');
                } else {
                    // Safety fallback: allow redirection default safely
                    navigate('/manage-listing');
                }
            } else {
                navigate('/manage-listing');
            }
        } catch (error: unknown) {
            console.error("Login error context logs:", error);
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert("An error occurred during login.");
            }
        }
    };

    return (
        <div className="login-page-wrapper">
            <Header />
            <div className="page-body">
                <div className="login-container">
                    <h2>Login</h2>
                    <form onSubmit={handleLogin}>
                        <div className="email-input">
                            <label htmlFor="email">Email address:</label><br />
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="password-input">
                            <label htmlFor="password">Password:</label><br />
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="role-selection">
                            <p>Role:</p>
                            <input
                                type="radio"
                                id="volunteer"
                                name="role"
                                value="volunteer"
                                checked={role === "volunteer"}
                                onChange={() => setRole("volunteer")}
                            />
                            <label htmlFor="volunteer">Volunteer</label>

                            <input
                                type="radio"
                                id="organization"
                                name="role"
                                value="organization"
                                checked={role === "organization"}
                                onChange={() => setRole("organization")}
                            />
                            <label htmlFor="organization">Organization</label>

                            <input
                                type="radio"
                                id="admin"
                                name="role"
                                value="admin"
                                checked={role === "admin"}
                                onChange={() => setRole("admin")}
                            />
                            <label htmlFor="admin">Admin</label>
                        </div>
                        <button type="submit" className="login-button">Login</button>
                    </form>

                    <Link className="forgot-password" to="/forgot-password">Forgot password</Link>

                    <p className="sign-up">Don't have an account? <Link to="/sign-up">Sign Up</Link></p>
                </div>
            </div>
        </div>
    );
}