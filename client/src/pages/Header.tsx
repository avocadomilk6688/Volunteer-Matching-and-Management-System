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
        logout();
        isShowProfileOptions(false);
        navigate('/');
    };

    // --- Dynamic Name Logic ---
    // This checks for username first (from the DB update), then name, then fallback
    const displayName = user?.username || user?.username || 'Volunteer';

    console.log("Current User in Header:", user);

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
                                Hi, {displayName}!
                            </span>

                            <button className="profile-icon" onClick={() => isShowProfileOptions(!showProfileOptions)}>
                                <MdAccountCircle size={32} color="white" />
                            </button>
                            <button className="notif-icon">
                                <MdNotifications size={24} color="white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showProfileOptions && (
                <div className="profile-options">
                    <Link
                        to="/volunteering-history"
                        className="view-volunteering-history"
                        onClick={() => isShowProfileOptions(false)}
                    >
                        View volunteering <br /> history
                    </Link>

                    <hr />

                    <Link
                        to="/manage-profile"
                        className="manage-profile"
                        onClick={() => isShowProfileOptions(false)}
                    >
                        Manage profile
                    </Link>

                    <hr />

                    <div className="log-out" onClick={handleLogout}>
                        Log out
                    </div>
                </div>
            )}
        </div>
    );
}