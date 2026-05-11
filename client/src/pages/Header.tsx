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

    // --- Role Constants ---
    const role = user?.role;
    const isVolunteer = role === 'volunteer';
    const isOrganization = role === 'organization';
    const isAdmin = role === 'admin';

    // --- Dynamic Name Logic ---
    const displayName = user?.username || (isAdmin ? 'Admin' : isOrganization ? 'Organization' : 'Volunteer');

    // --- Logo Link Logic ---
    const getLogoLink = () => {
        if (!isAuthenticated) return '/';
        if (isAdmin) return '/admin-dashboard';
        if (isOrganization) return '/manage-listing';
        return '/volunteer-home';
    };

    return (
        <div className="header-container">
            <Link to={getLogoLink()} className="header-logo">
                <h1>Volunteer Matching and Management System</h1>
            </Link>

            {isAuthenticated && (
                <div className="header-actions">
                    <div className="logged-in-nav">

                        {/* ONLY Volunteers see the Leaderboard */}
                        {isVolunteer && (
                            <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                        )}

                        {/* Everyone EXCEPT Admins sees Q&A */}
                        {!isAdmin && (
                            <Link to="/qa" className="nav-link">Q&A</Link>
                        )}

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
                    {/* Only Volunteers have history */}
                    {isVolunteer && (
                        <>
                            <Link
                                to="/volunteering-history"
                                className="view-volunteering-history"
                                onClick={() => isShowProfileOptions(false)}
                            >
                                View volunteering <br /> history
                            </Link>
                            <hr />
                        </>
                    )}

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