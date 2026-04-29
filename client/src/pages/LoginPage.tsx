import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import { Header } from './Header';
import './login_page.css';
import { useState } from 'react';
import { useAuth } from '../context/auth/useAuth';

export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("volunteer");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            login(data.access_token, {
                id: data.id,
                email: data.email,
                role: data.role,
                name: data.name
            });

            if (role === 'volunteer') {
                navigate('/volunteer-home');
            } else if (role === 'admin') {
                alert('Admin dashboard coming soon!');
            } else {
                alert('Organization dashboard coming soon!');
            }
        } catch (error: unknown) {
            console.error("Login error:", error);
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
                    <a className="forgot-password" href="#">Forgot password</a>
                    <p className="sign-up">Don't have an account? <Link to="/sign-up">Sign Up</Link></p>
                </div>
            </div>
        </div>
    );
}