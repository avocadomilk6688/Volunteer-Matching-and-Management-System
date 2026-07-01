import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import { Header } from './Header';
import { useState } from 'react';
import { useAuth } from '../context/auth/useAuth';
import './login_page.css';

const API_BASE_URL = "http://localhost:3000";

interface ProfileRelation {
    id: string;
    profile_picture_url?: string;
    registrationRecord?: {
        id: string;
        status: string;
    };
}

interface LoginResponseData {
    access_token: string;
    id: string;
    username: string;
    role: 'admin' | 'volunteer' | 'organization';
    volunteer?: ProfileRelation;
    organization?: ProfileRelation;
    message?: string;
}

interface RemoteRegistrationRecord {
    id: string;
    organizationName: string;
    authorizedPersonName: string;
    status: string;
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

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('userId', data.id);

            const unifiedAuthUserContext = {
                ...data,
                id: data.id,
                email: email,
                organization: data.organization ? {
                    ...data.organization,
                    id: data.organization.id || data.id
                } : undefined
            };


            if (role === 'volunteer') {
                login(data.access_token, unifiedAuthUserContext);
                navigate('/volunteer-home');
            } else if (role === 'admin') {
                login(data.access_token, unifiedAuthUserContext);
                navigate('/manage-user-account');
            } else if (role === 'organization') {
                const registrationRecord = data.organization?.registrationRecord;
                if (registrationRecord) {
                    login(data.access_token, unifiedAuthUserContext);
                    const rawStatus = registrationRecord.status || 'approved';
                    if (rawStatus.trim().toLowerCase() === 'approved') {
                        navigate('/manage-listing');
                    } else {
                        navigate('/pending-approval');
                    }
                } else {
                    // ─── FIXED: FETCH THE RAW INDIVIDUAL TARGET ROW DIRECTLY ───
                    try {
                        const singleRegResponse = await fetch(`${API_BASE_URL}/organizations/registration/${data.id}`, {
                            headers: { Authorization: `Bearer ${data.access_token}` }
                        });

                        if (singleRegResponse.ok) {
                            const remoteRecord = (await singleRegResponse.json()) as RemoteRegistrationRecord;
                            const currentStatus = remoteRecord.status?.trim().toLowerCase();

                            console.log("DEBUG: Isolated pending row verification check status state:", currentStatus);

                            // Update user context with the fetched registration record
                            unifiedAuthUserContext.organization = {
                                ...(unifiedAuthUserContext.organization || {}),
                                id: data.organization?.id || data.id,
                                registrationRecord: remoteRecord,
                            };

                            login(data.access_token, unifiedAuthUserContext);

                            if (currentStatus === 'pending') {
                                console.log("REDIRECT: Active unapproved record matched. Moving to pending route.");
                                navigate('/pending-approval');
                            } else if (currentStatus === 'approved') {
                                navigate('/manage-listing');
                            } else {
                                navigate('/organization-verification');
                            }
                        } else {
                            // If the individual row returns a 404 or fails, it means they never submitted a form
                            console.log("REDIRECT: Registration instance lookup failed. Prompting form layout entry.");
                            login(data.access_token, unifiedAuthUserContext);
                            navigate('/organization-verification');
                        }
                    } catch (checkError) {
                        console.error("Failed to query localized tracking indices:", checkError);
                        login(data.access_token, unifiedAuthUserContext);
                        navigate('/organization-verification');
                    }
                }
            } else {
                login(data.access_token, unifiedAuthUserContext);
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