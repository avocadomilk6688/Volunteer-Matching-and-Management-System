import { useState, useEffect } from 'react';
import { useAuth } from '../context/auth/useAuth';
import { Link, useNavigate } from 'react-router';
import { MdNotifications } from 'react-icons/md';
import axios from 'axios';
import './header.css';

const API_BASE_URL = "http://localhost:3000";

// --- Interfaces ---
interface ProfileRelation {
    profile_picture_url?: string;
    registrationRecord?: {
        status?: string;
    };
}

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

    // ─── 🌟 DERIVED READ PASS: DERIVE TIME DIRECTLY IN THE RENDER PASS TO AVOID RENDERING ERRORS ───
    const trueUserId = user?.id || localStorage.getItem('userId');
    let lastViewedNotifTime = 0;

    if (trueUserId && trueUserId !== 'undefined') {
        const stored = localStorage.getItem(`last_viewed_notifications_time_${trueUserId}`);
        lastViewedNotifTime = stored ? parseInt(stored, 10) : 0;
    }

    const role = user?.role;
    const isVolunteer = role === 'volunteer';
    const isOrganization = role === 'organization';
    const isAdmin = role === 'admin';

    const registrationStatus = user?.organization?.registrationRecord?.status?.trim().toLowerCase();
    const isUnverifiedOrg = isOrganization && (
        !user?.organization ||
        registrationStatus !== 'approved'
    );

    // Safe debug logging context
    console.log("CRITICAL HEADER DEBUG:", {
        rawUserRole: user?.role,
        typeOfRole: typeof user?.role,
        isOrgValid: isOrganization,
        isUnverified: isUnverifiedOrg,
        hasOrgObject: !!user?.organization
    });

    // 1. Fetch real notifications from backend
    useEffect(() => {
        if (isAuthenticated && user?.id && !isUnverifiedOrg) {
            const fetchNotifications = async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/interactions/user/${user.id}`);
                    setNotifications(res.data);
                } catch (err) {
                    console.error("Error fetching notifications:", err);
                }
            };

            fetchNotifications();

            // Refresh notifications every 60 seconds
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user?.id, isUnverifiedOrg]);

    // ─── 🌟 FIXED: ARCHIVE & RESTORE ALL USERS' TIMESTAMP KEYS BEFORE THE WIPE UNSETPASS ───
    const handleLogout = () => {
        const timestampArchive: { [key: string]: string } = {};

        // 1. Extract and preserve ALL active layout timestamp fields currently populated
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('last_viewed_chat_time_') || key.startsWith('last_viewed_notifications_time_'))) {
                const value = localStorage.getItem(key);
                if (value) {
                    timestampArchive[key] = value;
                }
            }
        }

        // 2. Execute central logout context pipeline (runs standard clear passes)
        logout();

        // 3. Re-inject the entire key payload snapshot back so it survives cross-role swaps
        Object.keys(timestampArchive).forEach((key) => {
            localStorage.setItem(key, timestampArchive[key]);
        });

        window.location.href = '/';
    };

    const toggleNotifications = () => {
        const currentUserId = user?.id || localStorage.getItem('userId');
        if (isUnverifiedOrg || !currentUserId || currentUserId === 'undefined') return;

        const nextState = !showNotifications;
        setShowNotifications(nextState);
        if (showProfileOptions) isShowProfileOptions(false);

        if (nextState) {
            const currentTimestamp = Date.now();
            const userSpecificKey = `last_viewed_notifications_time_${currentUserId}`;
            localStorage.setItem(userSpecificKey, currentTimestamp.toString());

            // Reference update pushes evaluation without local state locks
            setNotifications([...notifications]);
        }
    };

    const toggleProfile = () => {
        isShowProfileOptions(!showProfileOptions);
        if (showNotifications) setShowNotifications(false);
    };

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

    const displayName = isUnverifiedOrg
        ? "Organization"
        : (user?.username || (isAdmin ? 'Admin' : isOrganization ? 'Organization' : 'Volunteer'));

    const getProfilePic = () => {
        const defaultPic = '/images/default_profile_pic.png';
        if (!user || isAdmin || isUnverifiedOrg) return defaultPic;

        const picUrl = isVolunteer ? user.volunteer?.profile_picture_url : user.organization?.profile_picture_url;
        if (!picUrl) return defaultPic;
        if (picUrl.startsWith('http') || picUrl.startsWith('blob:')) return picUrl;

        if (picUrl.startsWith('/images/')) return picUrl;

        return `${API_BASE_URL}${picUrl.startsWith('/') ? '' : '/'}${picUrl}`;
    };

    const getLogoLink = () => {
        if (!isAuthenticated) return '/';
        if (isAdmin) return '/admin-dashboard';
        if (isOrganization) return isUnverifiedOrg ? '#' : '/manage-listing';
        return '/volunteer-home';
    };

    const hasUnreadNotifications = notifications.some(notif => {
        const notifTime = new Date(notif.createdAt).getTime();
        return notifTime > lastViewedNotifTime;
    });

    return (
        <div className="header-container">
            <Link to={getLogoLink()} className="header-logo" style={{ pointerEvents: isUnverifiedOrg ? 'none' : 'auto' }}>
                <h1>Volunteer Matching and Management System</h1>
            </Link>

            {isAuthenticated && (
                <div className="header-actions">
                    <div className="logged-in-nav">
                        {!isUnverifiedOrg && (
                            <>
                                {isVolunteer && <Link to="/leaderboard" className="nav-link">Leaderboard</Link>}
                                {!isAdmin && <Link to="/qa" className="nav-link">Q&A</Link>}
                            </>
                        )}

                        <div className="user-controls">
                            {!isUnverifiedOrg && <span className="greeting">Hi, {displayName}!</span>}

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

                            {!isUnverifiedOrg && (
                                <button className="notif-icon" onClick={toggleNotifications}>
                                    <MdNotifications size={24} color="white" />
                                    {hasUnreadNotifications && <span className="notif-badge"></span>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Notification Dropdown */}
            {showNotifications && !isUnverifiedOrg && (
                <div className="notification-dropdown">
                    {notifications.length > 0 ? (
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

            {/* Profile Options Dropdown Menu */}
            {showProfileOptions && (
                <div className="profile-options">
                    {isUnverifiedOrg ? (
                        <div className="log-out" onClick={handleLogout} style={{ padding: '12px 16px', cursor: 'pointer' }}>
                            Log out
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
}