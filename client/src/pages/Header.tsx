import './header.css';
import { useAuth } from '../context/auth/useAuth';
import { Link, useNavigate } from 'react-router';
import { MdAccountCircle, MdNotifications } from 'react-icons/md';
import { useState } from 'react';

export function Header() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileOptions, isShowProfileOptions] = useState(false);

    const handleLogout = () => {
        logout(); // This clears localStorage and resets state
        isShowProfileOptions(false); // Close the menu
        navigate('/'); // Redirect to landing page or login
    };

    return (
        <div className="header-container">
            <Link to={isAuthenticated ? '/volunteer-home' : '/'} className="header-logo">
                <h1>Volunteer Matching and Management System</h1>
            </Link>

            {isAuthenticated && (
                <div className="header-actions">
                    <div className="logged-in-nav">
                        <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                        <Link to="/qa" className="nav-link">Q&A</Link>

                        <div className="user-controls">
                            <span className="greeting">
                                Hi, {user?.name ? user.name : 'Volunteer'}!
                            </span>

                            <button className="profile-icon" onClick={() => isShowProfileOptions(!showProfileOptions)}>
                                <MdAccountCircle color="white" />
                            </button>
                            <button className="notif-icon">
                                <MdNotifications color="white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showProfileOptions && (
                <div className="profile-options">
                    <div className="view-volunteering-history">View volunteering <br /> history</div>
                    <hr />
                    <div className="manage-profile">Manage profile</div>
                    <hr />
                    <div className="log-out" onClick={handleLogout}>Log out</div>
                </div>
            )}
        </div>
    );
}