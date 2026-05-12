import './header.css';
import { useAuth } from '../context/auth/useAuth';
import { Link, useNavigate } from 'react-router';
import { MdNotifications } from 'react-icons/md';
import { useState } from 'react';

// --- Interfaces to satisfy the Linter ---
interface VolunteerRelation {
    profile_picture_url?: string;
}

interface OrganizationRelation {
    profile_picture_url?: string;
}

interface AuthenticatedUser {
    username: string;
    role: 'admin' | 'volunteer' | 'organization';
    volunteer?: VolunteerRelation;
    organization?: OrganizationRelation;
}

export function Header() {
    const { user: rawUser, isAuthenticated, logout } = useAuth();
    // Cast user to our extended interface
    const user = rawUser as AuthenticatedUser | null;

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

    // --- Profile Picture Helper (WITH DEBUG LOGS) ---
    const getProfilePic = () => {
        const defaultPic = '/images/default_profile_pic.png';

        // 1. Check if user exists
        if (!user) {
            console.log("DEBUG: No user found in AuthContext.");
            return defaultPic;
        }

        if (isAdmin) {
            console.log("DEBUG: User is Admin, using default pic.");
            return defaultPic;
        }

        // 2. Peek at the raw relation data
        console.log("DEBUG: Full User Object:", user);

        const picUrl = isVolunteer
            ? user.volunteer?.profile_picture_url
            : user.organization?.profile_picture_url;

        console.log("DEBUG: picUrl extracted from DB:", picUrl);

        if (!picUrl) {
            console.log("DEBUG: No picUrl found in relations. Using default.");
            return defaultPic;
        }

        // 3. Construct Final URL
        let finalUrl = "";
        if (picUrl.startsWith('http')) {
            finalUrl = picUrl;
        } else {
            finalUrl = `http://localhost:3000${picUrl.startsWith('/') ? '' : '/'}${picUrl}`;
        }

        console.log("DEBUG: Final Computed URL:", finalUrl);
        return finalUrl;
    };

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

                        {/* Role-based Link Visibility */}
                        {isVolunteer && (
                            <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                        )}

                        {!isAdmin && (
                            <Link to="/qa" className="nav-link">Q&A</Link>
                        )}

                        <div className="user-controls">
                            <span className="greeting">Hi, {displayName}!</span>

                            {/* Profile Picture Button */}
                            <button className="profile-icon" onClick={() => isShowProfileOptions(!showProfileOptions)}>
                                <div
                                    className="profile-image-circle"
                                    style={{ backgroundImage: `url("${getProfilePic()}")` }}
                                ></div>
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