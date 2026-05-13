import './header.css';
import { useAuth } from '../context/auth/useAuth';
import { Link, useNavigate } from 'react-router';
import { MdNotifications } from 'react-icons/md';
import { useState } from 'react';

const API_BASE_URL = "http://localhost:3000";

interface ProfileRelation { profile_picture_url?: string; }

interface AuthenticatedUser {
    id: string;
    username: string;
    role: 'admin' | 'volunteer' | 'organization';
    volunteer?: ProfileRelation;
    organization?: ProfileRelation;
}

// Hardcoded Data based on your image
const NOTIFICATIONS = [
    {
        id: 1,
        message: "Congratulations, you’ve been matched with the upcoming Community Clean-Up event on March 5th!",
        time: "15s ago"
    },
    {
        id: 2,
        message: "Your updated skills in ‘First Aid’ have been saved. New volunteer opportunities related are now available for you.",
        time: "30mins ago"
    },
    {
        id: 3,
        message: "Reminder: You’re scheduled for the Food Bank Distribution tomorrow at 9:00 AM. Please arrive 15 minutes early to check in.",
        time: "2h ago"
    }
];

export function Header() {
    const { user: rawUser, isAuthenticated, logout } = useAuth();
    const user = rawUser as AuthenticatedUser | null;
    const navigate = useNavigate();

    // States for dropdowns
    const [showProfileOptions, isShowProfileOptions] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogout = () => {
        logout();
        isShowProfileOptions(false);
        setShowNotifications(false);
        navigate('/');
    };

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
        if (showProfileOptions) isShowProfileOptions(false); // Close profile if notification opens
    };

    const toggleProfile = () => {
        isShowProfileOptions(!showProfileOptions);
        if (showNotifications) setShowNotifications(false); // Close notifications if profile opens
    };

    const role = user?.role;
    const isVolunteer = role === 'volunteer';
    const isOrganization = role === 'organization';
    const isAdmin = role === 'admin';

    const displayName = user?.username || (isAdmin ? 'Admin' : isOrganization ? 'Organization' : 'Volunteer');

    const getProfilePic = () => {
        const defaultPic = '/images/default_profile_pic.png';
        if (!user || isAdmin) return defaultPic;
        const picUrl = isVolunteer ? user.volunteer?.profile_picture_url : user.organization?.profile_picture_url;
        if (!picUrl) return defaultPic;
        if (picUrl.startsWith('http') || picUrl.startsWith('blob:')) return picUrl;
        return `${API_BASE_URL}${picUrl.startsWith('/') ? '' : '/'}${picUrl}`;
    };

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
                        {isVolunteer && <Link to="/leaderboard" className="nav-link">Leaderboard</Link>}
                        {!isAdmin && <Link to="/qa" className="nav-link">Q&A</Link>}

                        <div className="user-controls">
                            <span className="greeting">Hi, {displayName}!</span>

                            <button className="profile-icon" onClick={toggleProfile}>
                                <div
                                    className="profile-image-circle"
                                    style={{
                                        backgroundImage: `url("${getProfilePic()}")`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                ></div>
                            </button>

                            <button className="notif-icon" onClick={toggleNotifications}>
                                <MdNotifications size={24} color="white" />
                                {/* Optional: Red dot badge if there are notifications */}
                                <span className="notif-badge"></span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="notification-dropdown">
                    {NOTIFICATIONS.map((notif) => (
                        <div key={notif.id} className="notif-item">
                            <p className="notif-message">{notif.message}</p>
                            <span className="notif-time">{notif.time}</span>
                        </div>
                    ))}
                    {NOTIFICATIONS.length === 0 && (
                        <div className="notif-empty">No new notifications</div>
                    )}
                </div>
            )}

            {/* Profile Dropdown */}
            {showProfileOptions && (
                <div className="profile-options">
                    {isVolunteer && (
                        <>
                            <Link to="/volunteering-history" className="view-volunteering-history" onClick={() => isShowProfileOptions(false)}>
                                View volunteering <br /> history
                            </Link>
                            <hr />
                        </>
                    )}
                    <Link to="/manage-profile" className="manage-profile" onClick={() => isShowProfileOptions(false)}>
                        Manage profile
                    </Link>
                    <hr />
                    <div className="log-out" onClick={handleLogout}>Log out</div>
                </div>
            )}
        </div>
    );
}