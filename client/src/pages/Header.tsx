import './header.css';
import { useAuth } from '../context/auth/useAuth';
import { Link, useNavigate } from 'react-router';
import { MdNotifications } from 'react-icons/md';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = "http://localhost:3000";

// --- Interfaces ---
interface ProfileRelation { profile_picture_url?: string; }

interface Notification {
    id: string;
    content: string;
    createdAt: string;
}

interface AuthenticatedUser {
    id: string;
    username: string;
    role: 'admin' | 'volunteer' | 'organization';
    volunteer?: ProfileRelation;
    organization?: ProfileRelation;
}

export function Header() {
    const { user: rawUser, isAuthenticated, logout } = useAuth();
    const user = rawUser as AuthenticatedUser | null;
    const navigate = useNavigate();

    // States
    const [showProfileOptions, isShowProfileOptions] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // 1. Fetch real notifications from backend
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            const fetchNotifications = async () => {
                try {
                    // This assumes your backend has a GET /notifications/user/:id endpoint
                    const res = await axios.get(`${API_BASE_URL}/interactions/user/${user.id}`);
                    setNotifications(res.data);
                } catch (err) {
                    console.error("Error fetching notifications:", err);
                }
            };

            fetchNotifications();

            // Optional: Refresh notifications every 60 seconds
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user?.id]);

    const handleLogout = () => {
        logout();
        isShowProfileOptions(false);
        setShowNotifications(false);
        navigate('/');
    };

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
        if (showProfileOptions) isShowProfileOptions(false);
    };

    const toggleProfile = () => {
        isShowProfileOptions(!showProfileOptions);
        if (showNotifications) setShowNotifications(false);
    };

    // --- Helper: Format DB Date to "Time Ago" ---
    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInMs = now.getTime() - past.getTime();

        const seconds = Math.floor(diffInMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return `${seconds}s ago`;
        if (minutes < 60) return `${minutes}mins ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
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
                                {notifications.length > 0 && <span className="notif-badge"></span>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Notification Dropdown */}
            {showNotifications && (
                <div className="notification-dropdown">
                    {notifications.length > 0 ? (
                        // Sort by latest first before mapping
                        [...notifications]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((notif) => (
                                <div key={notif.id} className="notif-item">
                                    <p className="notif-message">{notif.content}</p>
                                    <span className="notif-time">{formatTimeAgo(notif.createdAt)}</span>
                                </div>
                            ))
                    ) : (
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