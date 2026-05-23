import React, { useState } from 'react';
import { Header } from './Header'; // Adjust path if needed to match your project structure
import { useNavigate, useSearchParams } from 'react-router';
import axios from 'axios';
import './reset_password_page.css';

const API_BASE_URL = "http://localhost:3000";

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // Assumes token is passed via query string

    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            alert("Please fill in all password fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Error: Passwords do not match.");
            return;
        }

        try {
            setSubmitting(true);
            
            await axios.post(`${API_BASE_URL}/auth/reset-password`, { 
                token,
                password 
            });

            alert("Your password has been successfully updated!");
            navigate('/login');
        } catch (error: unknown) {
            console.error("Reset password process error:", error);
            if (axios.isAxiosError(error) && error.response?.data) {
                alert(`Error: ${error.response.data.message || "Failed to update password."}`);
            } else {
                alert("Something went wrong. Please check your network connection.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="reset-password-page-wrapper">
            <Header />

            <main className="reset-password-main-content">
                <div className="reset-password-card">
                    <h1 className="reset-password-title">Reset Password</h1>

                    <form onSubmit={handleSubmit} className="reset-password-form">
                        <div className="reset-password-input-group">
                            <label htmlFor="new-password">New password:</label>
                            <input
                                type="password"
                                id="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="reset-password-input-group">
                            {/* Kept "Comfirm" to match the exact typo text layout from your layout screenshot */}
                            <label htmlFor="confirm-password">Comfirm password:</label>
                            <input
                                type="password"
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="reset-password-action-row">
                            <button 
                                type="submit" 
                                className="reset-password-submit-btn"
                                disabled={submitting}
                            >
                                {submitting ? "Updating..." : "Reset"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}