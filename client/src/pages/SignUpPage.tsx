import { Link, useNavigate } from 'react-router';
import { Header } from './Header';
import './sign_up_page.css';
import { useState } from 'react';
import { useAuth } from '../context/auth/useAuth';

export function SignUpPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("volunteer");

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if the password match with confirm password
        if (password !== confirmPassword) {
            alert("Error: Passwords do not match.");
            return;
        }

        try {
            console.log("Registering user:", { email, password, role });

            const mockToken = "mock_jwt_token_123";
            login(mockToken);

            if (role === "volunteer") {
                navigate('/volunteer-home');
            } else {
                alert('Coming soon.');
            }
        } catch (error) {
            console.error("Registration failed:", error);
            alert("An error occurred during registration. Please try again.");
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
                            <input type="email" id="email" value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required />
                        </div>
                        <div className="password-input">
                            <label htmlFor="password">Password:</label><br />
                            <input type="password" id="password" value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required />
                        </div>
                        <div className="confirm-password-input">
                            <label htmlFor="confirm-password">Confirm password:</label><br />
                            <input type="password" id="password" value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required />
                        </div>
                        <div className="role-selection">
                            <p>Role:</p>
                            <input type="radio" id="volunteer" name="role"
                                value="volunteer"
                                checked={role === "volunteer"}
                                onChange={() => setRole("volunteer")} />
                            <label htmlFor="volunteer">Volunteer</label>
                            <input type="radio" id="organization" name="role"
                                value="organization"
                                checked={role === "organization"}
                                onChange={() => setRole("organization")} />
                            <label htmlFor="organization">Organization</label>
                        </div>
                        <button className="sign-up-button">Sign Up</button>
                    </form>
                    <p className="sign-up">Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    )
}