import React, { useState } from 'react';
import { Header } from './Header'; // Adjust path if needed to match your project structure
import axios from 'axios';
import './forgot_password_page.css';

const API_BASE_URL = "http://localhost:3000";

export function ForgotPasswordPage() {
    const [email, setEmail] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            alert("Please enter your registered email address.");
            return;
        }

        try {
            setSubmitting(true);
            
            await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });

            alert("A password reset link has been successfully dispatched to your email address.");
            setEmail(""); // Reset input field on success
        } catch (error: unknown) {
            console.error("Forgot password process error:", error);
            if (axios.isAxiosError(error) && error.response?.data) {
                alert(`Error: ${error.response.data.message || "Failed to process request."}`);
            } else {
                alert("Something went wrong. Please check your network connection.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="forgot-password-page-wrapper">
            <Header />

            <main className="forgot-password-main-content">
                <div className="forgot-password-card">
                    <h1 className="forgot-password-title">Forgot Password</h1>

                    <form onSubmit={handleSubmit} className="forgot-password-form">
                        <div className="forgot-password-input-group">
                            <label htmlFor="registered-email">Registered email address:</label>
                            <input
                                type="email"
                                id="registered-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="forgot-password-action-row">
                            <button 
                                type="submit" 
                                className="forgot-password-submit-btn"
                                disabled={submitting}
                            >
                                {submitting ? "Sending..." : "Send reset link"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}