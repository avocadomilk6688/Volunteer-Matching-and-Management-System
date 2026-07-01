import { Link, useNavigate } from 'react-router';
import { Header } from './Header';
import './sign_up_page.css';
import { useState } from 'react';
import { useAuth } from '../context/auth/useAuth';

// ─── DEFINE AN EXPLICIT TYPE MATCHING THE AUTH PROVIDER EXPECTATIONS ───
interface SignUpUserPayload {
    id: string;
    username: string;
    role: 'admin' | 'volunteer' | 'organization';
    email: string;
}

export function SignUpPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("volunteer");

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if the password matches with confirm password
        if (password !== confirmPassword) {
            alert("Error: Passwords do not match.");
            return;
        }

        try {
            console.log("Registering user:", { email, password, role });

            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            // ─── LOGIN PROGRAMMATICALLY TO GET REAL TOKEN AND CONTEXT ───
            const loginResponse = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            });

            if (!loginResponse.ok) {
                throw new Error("Registration succeeded but initial login failed. Please login manually.");
            }

            const loginData = await loginResponse.json();
            localStorage.setItem('token', loginData.access_token);
            localStorage.setItem('userId', loginData.id);

            const unifiedAuthUserContext = {
                ...loginData,
                id: loginData.id,
                email: email,
                organization: loginData.organization ? {
                    ...loginData.organization,
                    id: loginData.organization.id || loginData.id
                } : undefined
            };

            if (login) {
                login(loginData.access_token, unifiedAuthUserContext);
            }

            // Redirection rules for roles optimization
            if (role === "volunteer") {
                navigate('/volunteer-home');
            } else if (role === "organization") {
                // Smoothly route them to your newly created verification layout
                navigate('/organization-verification');
            } else {
                alert('Coming soon.');
            }
        } catch (error) {
            console.error("Registration failed:", error);
            const message = error instanceof Error ? error.message : "An error occurred during registration.";
            alert(message);
        }
    }

    return (
        <div className="sign-up-page-wrapper">
            <Header />
            <div className="page-body">
                <div className="sign-up-container">
                    <h2>Sign Up</h2>
                    <form onSubmit={handleSignUp}>
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
                        <div className="confirm-password-input">
                            <label htmlFor="confirm-password">Confirm password:</label><br />
                            <input
                                type="password"
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                        </div>
                        <button type="submit" className="sign-up-button">Sign Up</button>
                    </form>
                    <p className="sign-up">Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
}